package com.hotpatch

import android.content.Context
import android.util.Log
import java.io.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import okhttp3.*
import org.json.JSONObject

object OTAUpdateManager {
    private const val TAG = "HotPatch"
    private var apiUrl: String = ""
    private var appId: String = ""
    private var channel: String = "production"
    private var encryptionKey: String? = null
    private var signingPublicKey: String? = null
    private var pinnedDomain: String? = null
    private var pinnedHash: String? = null

    private var client = OkHttpClient()
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    fun setup(
            url: String,
            id: String,
            ch: String,
            key: String? = null,
            signingKey: String? = null
    ) {
        apiUrl = url
        appId = id
        channel = ch
        encryptionKey = key
        signingPublicKey = signingKey
        rebuildClient()
    }

    fun setupCertificatePinning(domain: String, hash: String) {
        pinnedDomain = domain
        pinnedHash = hash
        rebuildClient()
    }

    private fun rebuildClient() {
        val builder = OkHttpClient.Builder()
        if (pinnedDomain != null && pinnedHash != null) {
            val pinner =
                    okhttp3.CertificatePinner.Builder().add(pinnedDomain!!, pinnedHash!!).build()
            builder.certificatePinner(pinner)
        }
        client = builder.build()
    }

    fun getBundlePath(context: Context): String? {
        val otaDir = File(context.filesDir, "ota")
        if (!otaDir.exists()) otaDir.mkdirs()

        // Increment crash count on every launch
        val crashCountFile = File(otaDir, "crash_count.json")
        var count = 0
        if (crashCountFile.exists()) {
            try {
                count = JSONObject(crashCountFile.readText()).optInt("count", 0)
            } catch (e: Exception) {}
        }

        if (count >= 2) {
            Log.e(TAG, "Boot loop detected! Rolling back to last stable version.")
            rollback(context)
            return null
        }

        // Write incremented count
        val json = JSONObject()
        json.put("count", count + 1)
        crashCountFile.writeText(json.toString())

        val otaBundle = File(context.filesDir, "ota/bundle/index.android.bundle")
        return if (otaBundle.exists() && isVerified(context)) {
            otaBundle.absolutePath
        } else {
            null
        }
    }

    private fun isVerified(context: Context): Boolean {
        val metadataFile = File(context.filesDir, "ota/metadata.json")
        if (!metadataFile.exists()) return false
        try {
            val json = JSONObject(metadataFile.readText())
            return json.has("version") && json.has("hash")
        } catch (e: Exception) {
            return false
        }
    }

    fun markSuccess(context: Context) {
        val crashCountFile = File(context.filesDir, "ota/crash_count.json")
        if (crashCountFile.exists()) {
            try {
                val json = JSONObject()
                json.put("count", 0)
                crashCountFile.writeText(json.toString())
            } catch (e: Exception) {}
        }
    }

    private fun rollback(context: Context) {
        val bundleDir = File(context.filesDir, "ota/bundle")
        val previousDir = File(context.filesDir, "ota/previous")

        // Load metadata to get releaseId before rollback
        var releaseId = ""
        val metadataFile = File(context.filesDir, "ota/metadata.json")
        if (metadataFile.exists()) {
            try {
                releaseId = JSONObject(metadataFile.readText()).optString("release_id")
            } catch (e: Exception) {}
        }

        if (previousDir.exists()) {
            if (bundleDir.exists()) bundleDir.deleteRecursively()
            previousDir.renameTo(bundleDir)

            // Clean up metadata or update it to previous if available
            // For now, just mark rollback in backend
            if (releaseId.isNotEmpty()) {
                reportInstallation(context, releaseId, "rolled_back", false, 0)
            }
        } else {
            bundleDir.deleteRecursively()
            metadataFile.delete()
        }
    }

    fun checkForUpdate(
            context: Context,
            currentVersion: String,
            deviceId: String,
            callback: (JSONObject?) -> Unit
    ) {
        val prefs = context.getSharedPreferences("HotPatch", Context.MODE_PRIVATE)
        prefs.edit().putString("deviceId", deviceId).apply()

        executor.execute {
            try {
                val url =
                        "$apiUrl/update/check?appId=$appId&deviceId=$deviceId&version=$currentVersion&platform=android&channel=$channel"
                val request = Request.Builder().url(url).header("X-App-Key", appId).build()
                val response = client.newCall(request).execute()
                val body = response.body?.string()

                if (body != null) {
                    val json = JSONObject(body)
                    if (json.optBoolean("updateAvailable")) {
                        callback(json)
                    } else {
                        callback(null)
                    }
                } else {
                    callback(null)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Update check failed", e)
                callback(null)
            }
        }
    }

    fun downloadAndApply(context: Context, updateJson: JSONObject) {
        executor.execute {
            try {
                val bundleUrl = updateJson.getString("bundleUrl")

                // Prepare dirs
                val bundleDir = File(context.filesDir, "ota/bundle")
                val previousDir = File(context.filesDir, "ota/previous")
                val pendingDir = File(context.filesDir, "ota/pending")
                if (!pendingDir.exists()) pendingDir.mkdirs()

                // Download
                val downloadedFile = File(pendingDir, "bundle.tmp")
                val request = Request.Builder().url(bundleUrl).build()
                val response = client.newCall(request).execute()

                val fos = FileOutputStream(downloadedFile)
                fos.write(response.body?.bytes())
                fos.close()

                var finalZip = downloadedFile

                // Step A: Handle Differential Patch
                if (updateJson.optBoolean("isPatch")) {
                    Log.i(TAG, "Applying differential patch...")
                    val currentBundleZip = File(context.filesDir, "ota/bundle.zip")
                    if (!currentBundleZip.exists()) {
                        Log.e(TAG, "Base bundle missing for patch!")
                        return@execute
                    }
                    val patchedZip = File(pendingDir, "bundle.patched.zip")
                    applyPatch(currentBundleZip, downloadedFile, patchedZip)
                    finalZip = patchedZip
                }

                // Step C: Verify Integrity
                val expectedHash = updateJson.optString("hash")
                if (expectedHash.isNotEmpty() && !HashUtils.verifyHash(finalZip, expectedHash)) {
                    Log.e(TAG, "Hash verification failed!")
                    return@execute
                }

                val signature = updateJson.optString("signature")
                if (signature.isNotEmpty() && signingPublicKey != null) {
                    if (!SignatureVerifier.verifySignature(finalZip, signature, signingPublicKey!!)
                    ) {
                        Log.e(TAG, "Signature verification failed!")
                        return@execute
                    }
                    Log.i(TAG, "Authenticity verified ✓")
                }

                // Step B: Handle Decryption (after verification, before extraction)
                if (updateJson.optBoolean("isEncrypted")) {
                    Log.i(TAG, "Decrypting bundle...")
                    val decryptedZip = File(pendingDir, "bundle.decrypted.zip")
                    decryptFile(finalZip, decryptedZip, encryptionKey)
                    finalZip = decryptedZip
                }

                // Move current to previous
                if (bundleDir.exists()) {
                    if (previousDir.exists()) previousDir.deleteRecursively()
                    bundleDir.renameTo(previousDir)
                }

                // Extract ZIP
                bundleDir.mkdirs()
                unzip(finalZip, bundleDir)

                // Save metadata
                val metadata =
                        JSONObject().apply {
                            put("version", updateJson.getString("version"))
                            put("hash", updateJson.getString("hash"))
                            put(
                                    "release_id",
                                    updateJson.optString("id", updateJson.optString("release_id"))
                            )
                            put("installed_at", System.currentTimeMillis())
                        }
                File(context.filesDir, "ota/metadata.json").writeText(metadata.toString())

                // Keep the final zip for future differential updates
                finalZip.copyTo(File(context.filesDir, "ota/bundle.zip"), overwrite = true)

                Log.i(TAG, "Update Applied Successfully.")

                // Report installation
                val releaseId = updateJson.optString("id", updateJson.optString("release_id"))
                val isPatch = updateJson.optBoolean("isPatch")
                val downloadSize = downloadedFile.length()

                reportInstallation(context, releaseId, "applied", isPatch, downloadSize)

                if (updateJson.optBoolean("mandatory")) {
                    Log.i(TAG, "Mandatory update! Triggering reload...")
                    triggerReload(context)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Download failed", e)
            }
        }
    }

    private fun reportInstallation(
            context: Context,
            releaseId: String,
            status: String,
            isPatch: Boolean,
            downloadSize: Long
    ) {
        val prefs = context.getSharedPreferences("HotPatch", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("deviceId", null) ?: return

        val url = "$apiUrl/installations"
        val body =
                JSONObject().apply {
                    put("device_id", deviceId)
                    put("release_id", releaseId)
                    put("status", status)
                    put("is_patch", isPatch)
                    put("download_size", downloadSize)
                }

        val request =
                Request.Builder()
                        .url(url)
                        .post(
                                RequestBody.create(
                                        MediaType.parse("application/json"),
                                        body.toString()
                                )
                        )
                        .addHeader("X-App-Key", appId)
                        .build()

        client.newCall(request)
                .enqueue(
                        object : Callback {
                            override fun onFailure(call: Call, e: IOException) {
                                Log.e(TAG, "Reporting failed", e)
                            }
                            override fun onResponse(call: Call, response: Response) {
                                response.close()
                            }
                        }
                )
    }

    private fun applyPatch(oldFile: File, patchFile: File, outputFile: File) {
        Log.i(TAG, "Applying binary patch from ${oldFile.name}")
        PatchUtils.applyPatch(oldFile, patchFile, outputFile)
    }

    private fun decryptFile(inputFile: File, outputFile: File, keyHex: String?) {
        if (keyHex == null) throw Exception("Decryption key missing")

        val data = inputFile.readBytes()
        val nonce = data.sliceArray(0 until 12)
        val ciphertext = data.sliceArray(12 until data.size)

        val key = hexToBytes(keyHex)
        val secretKey = javax.crypto.spec.SecretKeySpec(key, "AES")
        val cipher = javax.crypto.Cipher.getInstance("AES/GCM/NoPadding")
        val gcmSpec = javax.crypto.spec.GCMParameterSpec(128, nonce)

        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, secretKey, gcmSpec)
        val decrypted = cipher.doFinal(ciphertext)

        outputFile.writeBytes(decrypted)
    }

    private fun unzip(zipFile: File, targetDir: File) {
        val zipIn = java.util.zip.ZipInputStream(java.io.FileInputStream(zipFile))
        var entry = zipIn.nextEntry
        while (entry != null) {
            val filePath = File(targetDir, entry.name)
            if (!entry.isDirectory) {
                val fos = java.io.FileOutputStream(filePath)
                zipIn.copyTo(fos)
                fos.close()
            } else {
                filePath.mkdirs()
            }
            zipIn.closeEntry()
            entry = zipIn.nextEntry
        }
        zipIn.close()
    }

    private fun hexToBytes(hex: String): ByteArray {
        val result = ByteArray(hex.length / 2)
        for (i in 0 until hex.length step 2) {
            result[i / 2] = hex.substring(i, i + 2).toInt(16).toByte()
        }
        return result
    }

    private fun triggerReload(context: Context) {
        try {
            val activity =
                    (context as? android.app.Activity)
                            ?: (context as? android.content.ContextWrapper)?.baseContext as?
                                    android.app.Activity

            activity?.runOnUiThread {
                // This is a simplified way to reload.
                // A better way is using ReactInstanceManager.
                activity.recreate()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to reload activity", e)
        }
    }
}
