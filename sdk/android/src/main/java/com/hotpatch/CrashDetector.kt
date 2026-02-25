package com.hotpatch

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter

/**
 * CrashDetector monitors application crashes and boot loops to enable
 * automatic rollback of bad OTA updates.
 *
 * ## How it works:
 * 1. On every app launch, the crash counter is incremented.
 * 2. If the app survives long enough (via [markBootSuccessful]), the counter resets to 0.
 * 3. If the counter reaches [MAX_CRASH_COUNT] (default: 2), the OTA bundle is rolled back
 *    to the previous known-good version.
 *
 * ## Usage:
 * ```kotlin
 * // In Application.onCreate():
 * CrashDetector.initialize(this)
 *
 * // After the React Native bridge is fully loaded:
 * CrashDetector.markBootSuccessful(this)
 * ```
 */
object CrashDetector {

    private const val TAG = "HotPatch.CrashDetector"
    private const val MAX_CRASH_COUNT = 2
    private const val CRASH_LOG_DIR = "ota/crash_logs"
    private const val CRASH_META_FILE = "ota/crash_meta.json"

    private var originalHandler: Thread.UncaughtExceptionHandler? = null

    /**
     * Initialize the crash detector. Should be called as early as possible
     * in the application lifecycle (e.g., Application.onCreate).
     *
     * This does two things:
     * 1. Increments the boot counter to detect boot loops.
     * 2. Installs an uncaught exception handler to log crashes.
     */
    fun initialize(context: Context) {
        incrementBootCounter(context)
        installCrashHandler(context)

        val bootCount = getBootCount(context)
        Log.d(TAG, "CrashDetector initialized. Boot count: $bootCount/$MAX_CRASH_COUNT")

        if (bootCount >= MAX_CRASH_COUNT) {
            Log.e(TAG, "⚠️ Boot loop detected ($bootCount consecutive failures). Triggering rollback.")
            triggerRollback(context)
        }
    }

    /**
     * Mark the current boot as successful. This resets the crash counter to 0.
     * Call this after the React Native bridge has loaded and the app is stable.
     */
    fun markBootSuccessful(context: Context) {
        val metaFile = File(context.filesDir, CRASH_META_FILE)
        val json = if (metaFile.exists()) {
            try { JSONObject(metaFile.readText()) } catch (e: Exception) { JSONObject() }
        } else {
            JSONObject()
        }

        json.put("boot_count", 0)
        json.put("last_successful_boot", System.currentTimeMillis())

        metaFile.parentFile?.mkdirs()
        metaFile.writeText(json.toString())

        Log.i(TAG, "✅ Boot marked as successful. Crash counter reset.")
    }

    /**
     * Returns the current consecutive boot count (incremented on each launch,
     * reset on [markBootSuccessful]).
     */
    fun getBootCount(context: Context): Int {
        val metaFile = File(context.filesDir, CRASH_META_FILE)
        if (!metaFile.exists()) return 0
        return try {
            JSONObject(metaFile.readText()).optInt("boot_count", 0)
        } catch (e: Exception) {
            0
        }
    }

    /**
     * Returns the most recent crash logs (up to [limit] entries).
     * Each entry includes the timestamp, exception class, message, and stack trace.
     */
    fun getRecentCrashLogs(context: Context, limit: Int = 10): List<JSONObject> {
        val logDir = File(context.filesDir, CRASH_LOG_DIR)
        if (!logDir.exists()) return emptyList()

        return logDir.listFiles()
            ?.filter { it.extension == "json" }
            ?.sortedByDescending { it.lastModified() }
            ?.take(limit)
            ?.mapNotNull { file ->
                try { JSONObject(file.readText()) } catch (e: Exception) { null }
            } ?: emptyList()
    }

    /**
     * Clears all stored crash logs.
     */
    fun clearCrashLogs(context: Context) {
        val logDir = File(context.filesDir, CRASH_LOG_DIR)
        if (logDir.exists()) {
            logDir.deleteRecursively()
        }
        Log.d(TAG, "Crash logs cleared.")
    }

    /**
     * Returns true if the last app exit was a crash (i.e., boot count > 0
     * after the last launch).
     */
    fun didLastSessionCrash(context: Context): Boolean {
        val metaFile = File(context.filesDir, CRASH_META_FILE)
        if (!metaFile.exists()) return false
        return try {
            val json = JSONObject(metaFile.readText())
            json.optBoolean("last_exit_was_crash", false)
        } catch (e: Exception) {
            false
        }
    }

    // ── Private Implementation ──────────────────────────────────

    private fun incrementBootCounter(context: Context) {
        val metaFile = File(context.filesDir, CRASH_META_FILE)
        val json = if (metaFile.exists()) {
            try { JSONObject(metaFile.readText()) } catch (e: Exception) { JSONObject() }
        } else {
            JSONObject()
        }

        val currentCount = json.optInt("boot_count", 0)
        json.put("boot_count", currentCount + 1)
        json.put("last_boot_time", System.currentTimeMillis())

        metaFile.parentFile?.mkdirs()
        metaFile.writeText(json.toString())
    }

    private fun installCrashHandler(context: Context) {
        originalHandler = Thread.getDefaultUncaughtExceptionHandler()

        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try {
                saveCrashLog(context, throwable)
                markLastExitAsCrash(context)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to save crash log", e)
            }

            // Forward to the original handler (React Native, Firebase Crashlytics, etc.)
            originalHandler?.uncaughtException(thread, throwable)
        }
    }

    private fun saveCrashLog(context: Context, throwable: Throwable) {
        val logDir = File(context.filesDir, CRASH_LOG_DIR)
        logDir.mkdirs()

        // Limit total crash logs to prevent disk bloat
        val existingLogs = logDir.listFiles()?.sortedBy { it.lastModified() } ?: emptyList()
        if (existingLogs.size >= 20) {
            // Remove the oldest logs
            existingLogs.take(existingLogs.size - 19).forEach { it.delete() }
        }

        val sw = StringWriter()
        throwable.printStackTrace(PrintWriter(sw))

        val crashLog = JSONObject().apply {
            put("timestamp", System.currentTimeMillis())
            put("exception_class", throwable.javaClass.name)
            put("message", throwable.message ?: "")
            put("stack_trace", sw.toString())
            put("thread", Thread.currentThread().name)

            // Include OTA metadata if available
            val metadataFile = File(context.filesDir, "ota/metadata.json")
            if (metadataFile.exists()) {
                try {
                    val otaMeta = JSONObject(metadataFile.readText())
                    put("ota_version", otaMeta.optString("version", "unknown"))
                    put("ota_release_id", otaMeta.optString("release_id", "unknown"))
                } catch (e: Exception) {
                    put("ota_version", "parse_error")
                }
            }
        }

        val filename = "crash_${System.currentTimeMillis()}.json"
        File(logDir, filename).writeText(crashLog.toString())
        Log.d(TAG, "Crash log saved: $filename")
    }

    private fun markLastExitAsCrash(context: Context) {
        val metaFile = File(context.filesDir, CRASH_META_FILE)
        val json = if (metaFile.exists()) {
            try { JSONObject(metaFile.readText()) } catch (e: Exception) { JSONObject() }
        } else {
            JSONObject()
        }
        json.put("last_exit_was_crash", true)
        json.put("last_crash_time", System.currentTimeMillis())
        metaFile.writeText(json.toString())
    }

    private fun triggerRollback(context: Context) {
        Log.w(TAG, "🔄 Initiating automatic rollback...")

        val bundleDir = File(context.filesDir, "ota/bundle")
        val previousDir = File(context.filesDir, "ota/previous")
        val metadataFile = File(context.filesDir, "ota/metadata.json")

        // Try to get release ID before rollback for reporting
        var releaseId = ""
        if (metadataFile.exists()) {
            try {
                releaseId = JSONObject(metadataFile.readText()).optString("release_id", "")
            } catch (e: Exception) {
                // Ignore parse errors
            }
        }

        if (previousDir.exists()) {
            // Restore previous known-good version
            if (bundleDir.exists()) bundleDir.deleteRecursively()
            previousDir.renameTo(bundleDir)
            Log.i(TAG, "✅ Rolled back to previous bundle.")
        } else {
            // No previous version — remove the OTA bundle entirely (fall back to built-in)
            if (bundleDir.exists()) bundleDir.deleteRecursively()
            metadataFile.delete()
            Log.i(TAG, "✅ Removed OTA bundle. App will use built-in bundle.")
        }

        // Reset boot counter after rollback
        markBootSuccessful(context)

        // Report rollback to backend (fire-and-forget)
        if (releaseId.isNotEmpty()) {
            OTAUpdateManager.markSuccess(context) // Also reset OTAUpdateManager's counter
            try {
                reportRollback(context, releaseId)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to report rollback to backend", e)
            }
        }
    }

    private fun reportRollback(context: Context, releaseId: String) {
        val prefs = context.getSharedPreferences("HotPatch", Context.MODE_PRIVATE)
        val deviceId = prefs.getString("deviceId", null) ?: return

        // Use OTAUpdateManager to report the rollback
        // The actual HTTP call is delegated to avoid code duplication
        Log.i(TAG, "Reporting rollback to backend for release: $releaseId, device: $deviceId")

        // Store pending rollback report in SharedPreferences for retry
        val pendingReports = prefs.getStringSet("pending_rollback_reports", mutableSetOf()) ?: mutableSetOf()
        pendingReports.add("$releaseId|${System.currentTimeMillis()}")
        prefs.edit().putStringSet("pending_rollback_reports", pendingReports).apply()
    }
}
