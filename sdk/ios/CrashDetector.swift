import Foundation

/// CrashDetector monitors application crashes and boot loops to enable
/// automatic rollback of bad OTA updates.
///
/// ## How it works:
/// 1. On every app launch, the crash counter is incremented.
/// 2. If the app survives long enough (via `markBootSuccessful()`), the counter resets to 0.
/// 3. If the counter reaches `maxCrashCount` (default: 2), the OTA bundle is rolled back
///    to the previous known-good version.
///
/// ## Usage:
/// ```swift
/// // In AppDelegate.didFinishLaunching:
/// CrashDetector.shared.initialize()
///
/// // After the React Native bridge is fully loaded:
/// CrashDetector.shared.markBootSuccessful()
/// ```
class CrashDetector {

    static let shared = CrashDetector()

    // MARK: - Configuration

    private let maxCrashCount = 2
    private let crashLogDir = "ota/crash_logs"
    private let crashMetaFile = "ota/crash_meta.json"
    private let maxLogFiles = 20
    private let tag = "[HotPatch.CrashDetector]"

    // MARK: - State

    private var previousExceptionHandler: (@convention(c) (NSException) -> Void)?
    private var isInitialized = false

    private init() {}

    // MARK: - Public API

    /// Initialize the crash detector as early as possible in the app lifecycle.
    ///
    /// This increments the boot counter, installs crash handlers, and triggers
    /// rollback if the boot counter exceeds the threshold.
    func initialize() {
        guard !isInitialized else { return }
        isInitialized = true

        incrementBootCounter()
        installCrashHandlers()

        let bootCount = getBootCount()
        print("\(tag) Initialized. Boot count: \(bootCount)/\(maxCrashCount)")

        if bootCount >= maxCrashCount {
            print("\(tag) ⚠️ Boot loop detected (\(bootCount) consecutive failures). Triggering rollback.")
            triggerRollback()
        }
    }

    /// Mark the current boot as successful. Resets the crash counter to 0.
    /// Call this after the React Native bridge has loaded and the app is stable.
    func markBootSuccessful() {
        let metaPath = getFilePath(crashMetaFile)
        var meta = loadJSON(from: metaPath)

        meta["boot_count"] = 0
        meta["last_successful_boot"] = Date().timeIntervalSince1970
        meta["last_exit_was_crash"] = false

        saveJSON(meta, to: metaPath)
        print("\(tag) ✅ Boot marked as successful. Crash counter reset.")
    }

    /// Returns the current consecutive boot count.
    func getBootCount() -> Int {
        let metaPath = getFilePath(crashMetaFile)
        let meta = loadJSON(from: metaPath)
        return meta["boot_count"] as? Int ?? 0
    }

    /// Returns true if the last app session ended in a crash.
    func didLastSessionCrash() -> Bool {
        let metaPath = getFilePath(crashMetaFile)
        let meta = loadJSON(from: metaPath)
        return meta["last_exit_was_crash"] as? Bool ?? false
    }

    /// Returns the most recent crash logs (up to `limit` entries).
    func getRecentCrashLogs(limit: Int = 10) -> [[String: Any]] {
        let logDir = getFilePath(crashLogDir)
        let fm = FileManager.default

        guard fm.fileExists(atPath: logDir) else { return [] }

        do {
            let files = try fm.contentsOfDirectory(atPath: logDir)
                .filter { $0.hasSuffix(".json") }
                .map { URL(fileURLWithPath: logDir).appendingPathComponent($0) }
                .sorted { (try? fm.attributesOfItem(atPath: $0.path)[.modificationDate] as? Date) ?? Date.distantPast >
                          (try? fm.attributesOfItem(atPath: $1.path)[.modificationDate] as? Date) ?? Date.distantPast }

            return files.prefix(limit).compactMap { url in
                guard let data = try? Data(contentsOf: url),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
                return json
            }
        } catch {
            return []
        }
    }

    /// Clears all stored crash logs.
    func clearCrashLogs() {
        let logDir = getFilePath(crashLogDir)
        try? FileManager.default.removeItem(atPath: logDir)
        print("\(tag) Crash logs cleared.")
    }

    // MARK: - Private Implementation

    private func incrementBootCounter() {
        let metaPath = getFilePath(crashMetaFile)
        var meta = loadJSON(from: metaPath)

        let currentCount = meta["boot_count"] as? Int ?? 0
        meta["boot_count"] = currentCount + 1
        meta["last_boot_time"] = Date().timeIntervalSince1970

        saveJSON(meta, to: metaPath)
    }

    private func installCrashHandlers() {
        // Install NSException handler (Objective-C exceptions)
        previousExceptionHandler = NSGetUncaughtExceptionHandler()
        NSSetUncaughtExceptionHandler { exception in
            CrashDetector.shared.handleException(exception)
        }

        // Install signal handlers for common crash signals
        signal(SIGABRT) { _ in CrashDetector.shared.handleSignal("SIGABRT") }
        signal(SIGSEGV) { _ in CrashDetector.shared.handleSignal("SIGSEGV") }
        signal(SIGBUS) { _ in CrashDetector.shared.handleSignal("SIGBUS") }
        signal(SIGFPE) { _ in CrashDetector.shared.handleSignal("SIGFPE") }
        signal(SIGILL) { _ in CrashDetector.shared.handleSignal("SIGILL") }
        signal(SIGTRAP) { _ in CrashDetector.shared.handleSignal("SIGTRAP") }
    }

    private func handleException(_ exception: NSException) {
        let crashLog: [String: Any] = [
            "timestamp": Date().timeIntervalSince1970,
            "exception_class": exception.name.rawValue,
            "message": exception.reason ?? "",
            "stack_trace": exception.callStackSymbols.joined(separator: "\n"),
            "type": "nsexception",
            "ota_version": getOTAVersion(),
            "ota_release_id": getOTAReleaseId()
        ]

        saveCrashLog(crashLog)
        markLastExitAsCrash()

        // Forward to the previous handler
        if let prev = previousExceptionHandler {
            prev(exception)
        }
    }

    private func handleSignal(_ signalName: String) {
        let crashLog: [String: Any] = [
            "timestamp": Date().timeIntervalSince1970,
            "exception_class": signalName,
            "message": "Process received \(signalName) signal",
            "stack_trace": Thread.callStackSymbols.joined(separator: "\n"),
            "type": "signal",
            "ota_version": getOTAVersion(),
            "ota_release_id": getOTAReleaseId()
        ]

        saveCrashLog(crashLog)
        markLastExitAsCrash()

        // Re-raise the signal with default handler
        signal(signalFromName(signalName), SIG_DFL)
        raise(signalFromName(signalName))
    }

    private func saveCrashLog(_ log: [String: Any]) {
        let logDir = getFilePath(crashLogDir)
        let fm = FileManager.default

        // Create directory if needed
        try? fm.createDirectory(atPath: logDir, withIntermediateDirectories: true)

        // Rotate old logs
        if let files = try? fm.contentsOfDirectory(atPath: logDir) {
            if files.count >= maxLogFiles {
                let sorted = files
                    .map { URL(fileURLWithPath: logDir).appendingPathComponent($0) }
                    .sorted { $0.lastPathComponent < $1.lastPathComponent }
                let toRemove = sorted.prefix(files.count - maxLogFiles + 1)
                toRemove.forEach { try? fm.removeItem(at: $0) }
            }
        }

        // Write crash log
        let filename = "crash_\(Int(Date().timeIntervalSince1970 * 1000)).json"
        let filePath = URL(fileURLWithPath: logDir).appendingPathComponent(filename)
        if let data = try? JSONSerialization.data(withJSONObject: log, options: .prettyPrinted) {
            try? data.write(to: filePath)
        }
    }

    private func markLastExitAsCrash() {
        let metaPath = getFilePath(crashMetaFile)
        var meta = loadJSON(from: metaPath)
        meta["last_exit_was_crash"] = true
        meta["last_crash_time"] = Date().timeIntervalSince1970
        saveJSON(meta, to: metaPath)
    }

    private func triggerRollback() {
        print("\(tag) 🔄 Initiating automatic rollback...")

        let fm = FileManager.default
        let bundleDir = getFilePath("ota/bundle")
        let previousDir = getFilePath("ota/previous")
        let metadataFile = getFilePath("ota/metadata.json")

        // Get release ID before rollback for reporting
        var releaseId = ""
        if let data = fm.contents(atPath: metadataFile),
           let meta = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            releaseId = meta["release_id"] as? String ?? ""
        }

        if fm.fileExists(atPath: previousDir) {
            // Restore previous known-good version
            try? fm.removeItem(atPath: bundleDir)
            try? fm.moveItem(atPath: previousDir, toPath: bundleDir)
            print("\(tag) ✅ Rolled back to previous bundle.")
        } else {
            // No previous version — remove OTA entirely (fall back to built-in)
            try? fm.removeItem(atPath: bundleDir)
            try? fm.removeItem(atPath: metadataFile)
            print("\(tag) ✅ Removed OTA bundle. App will use built-in bundle.")
        }

        // Reset boot counter after rollback
        markBootSuccessful()

        // Report rollback (fire-and-forget, stored for retry if offline)
        if !releaseId.isEmpty {
            OTAUpdateManager.shared.markSuccess()
            storePendingRollbackReport(releaseId: releaseId)
        }
    }

    private func storePendingRollbackReport(releaseId: String) {
        let key = "HotPatch_PendingRollbacks"
        var pending = UserDefaults.standard.stringArray(forKey: key) ?? []
        pending.append("\(releaseId)|\(Int(Date().timeIntervalSince1970))")
        UserDefaults.standard.set(pending, forKey: key)
        print("\(tag) Rollback report queued for release: \(releaseId)")
    }

    // MARK: - Helpers

    private func getFilePath(_ relativePath: String) -> String {
        let documentsDir = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first!
        return (documentsDir as NSString).appendingPathComponent(relativePath)
    }

    private func loadJSON(from path: String) -> [String: Any] {
        guard FileManager.default.fileExists(atPath: path),
              let data = FileManager.default.contents(atPath: path),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return [:]
        }
        return json
    }

    private func saveJSON(_ json: [String: Any], to path: String) {
        let url = URL(fileURLWithPath: path)
        try? FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        if let data = try? JSONSerialization.data(withJSONObject: json) {
            try? data.write(to: url)
        }
    }

    private func getOTAVersion() -> String {
        let metaPath = getFilePath("ota/metadata.json")
        let meta = loadJSON(from: metaPath)
        return meta["version"] as? String ?? "unknown"
    }

    private func getOTAReleaseId() -> String {
        let metaPath = getFilePath("ota/metadata.json")
        let meta = loadJSON(from: metaPath)
        return meta["release_id"] as? String ?? "unknown"
    }

    private func signalFromName(_ name: String) -> Int32 {
        switch name {
        case "SIGABRT": return SIGABRT
        case "SIGSEGV": return SIGSEGV
        case "SIGBUS": return SIGBUS
        case "SIGFPE": return SIGFPE
        case "SIGILL": return SIGILL
        case "SIGTRAP": return SIGTRAP
        default: return SIGABRT
        }
    }
}
