package com.hotpatch

import com.facebook.react.bridge.*

class OTAModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "HotPatchSDK"

    @ReactMethod
    fun setup(
            apiUrl: String,
            appId: String,
            channel: String,
            encryptionKey: String?,
            signingKey: String?
    ) {
        OTAUpdateManager.setup(apiUrl, appId, channel, encryptionKey, signingKey)
    }

    @ReactMethod
    fun setupCertificatePinning(domain: String, hash: String) {
        OTAUpdateManager.setupCertificatePinning(domain, hash)
    }

    @ReactMethod
    fun checkForUpdate(promise: Promise) {
        val context = reactApplicationContext
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        val currentVersion = packageInfo.versionName ?: "1.0.0"

        val deviceId =
                android.provider.Settings.Secure.getString(
                        context.contentResolver,
                        android.provider.Settings.Secure.ANDROID_ID
                )
                        ?: "unknown-android"

        OTAUpdateManager.checkForUpdate(context, currentVersion, deviceId) { update ->
            if (update != null) {
                val map = Arguments.createMap()
                map.putBoolean("updateAvailable", true)
                map.putString("version", update.optString("version"))
                map.putString("hash", update.optString("hash"))
                map.putString("signature", update.optString("signature"))
                map.putString("bundleUrl", update.optString("bundleUrl"))
                map.putBoolean("mandatory", update.optBoolean("mandatory"))
                map.putBoolean("isEncrypted", update.optBoolean("isEncrypted"))
                map.putBoolean("isPatch", update.optBoolean("isPatch"))
                map.putString("baseVersion", update.optString("baseVersion"))
                map.putString("releaseId", update.optString("id", update.optString("release_id")))
                promise.resolve(map)
            } else {
                val map = Arguments.createMap()
                map.putBoolean("updateAvailable", false)
                promise.resolve(map)
            }
        }
    }

    @ReactMethod
    fun applyUpdate(updateMap: ReadableMap, promise: Promise) {
        try {
            val updateJson = org.json.JSONObject()
            val iterator = updateMap.keySetIterator()
            while (iterator.hasNextKey()) {
                val key = iterator.nextKey()
                when (updateMap.getType(key)) {
                    ReadableType.Boolean -> updateJson.put(key, updateMap.getBoolean(key))
                    ReadableType.Number -> updateJson.put(key, updateMap.getDouble(key))
                    ReadableType.String -> updateJson.put(key, updateMap.getString(key))
                    ReadableType.Map -> {
                        // Handle nested if needed, but not required for current spec
                    }
                    else -> {}
                }
            }

            OTAUpdateManager.downloadAndApply(reactApplicationContext, updateJson)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("apply_failed", e.message)
        }
    }

    @ReactMethod
    fun getCurrentVersion(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            promise.resolve(packageInfo.versionName)
        } catch (e: Exception) {
            promise.resolve("1.0.0")
        }
    }

    @ReactMethod
    fun markSuccess(promise: Promise) {
        OTAUpdateManager.markSuccess(reactApplicationContext)
        promise.resolve(null)
    }
}
