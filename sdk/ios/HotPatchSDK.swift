import Foundation
import React

@objc(HotPatchSDK)
class HotPatchSDK: NSObject {
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc func setup(_ apiUrl: String, appId: String, channel: String, encryptionKey: String?) {
        OTAUpdateManager.shared.setup(url: apiUrl, id: appId, ch: channel, key: encryptionKey)
    }
    
    @objc func checkForUpdate(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let deviceId = Self.getDeviceId()
        
        OTAUpdateManager.shared.checkForUpdate(version: currentVersion, deviceId: deviceId) { update in
            if let update = update {
                resolve([
                    "updateAvailable": true,
                    "version": update["version"] ?? "",
                    "bundleUrl": update["bundleUrl"] ?? "",
                    "mandatory": update["mandatory"] ?? false,
                    "isEncrypted": update["isEncrypted"] ?? false,
                    "isPatch": update["isPatch"] ?? false,
                    "baseVersion": update["baseVersion"] ?? ""
                ])
            } else {
                resolve(["updateAvailable": false])
            }
        }
    }
    
    @objc func applyUpdate(_ updateJson: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        OTAUpdateManager.shared.downloadAndApply(updateJson: updateJson) { success in
            if success {
                resolve(true)
            } else {
                reject("update_failed", "Failed to download or apply update", nil)
            }
        }
    }
    
    @objc func getCurrentVersion(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        resolve(version)
    }

    @objc func markSuccess(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        OTAUpdateManager.shared.markSuccess()
        resolve(nil)
    }
    
    // MARK: - Private Helpers
    
    /// Returns a stable device identifier using identifierForVendor (preferred)
    /// or a persisted UUID as fallback.
    private static func getDeviceId() -> String {
        #if canImport(UIKit)
        if let vendorId = UIDevice.current.identifierForVendor?.uuidString {
            return vendorId
        }
        #endif
        
        // Fallback: persisted UUID
        let key = "HotPatch_DeviceId"
        if let existingId = UserDefaults.standard.string(forKey: key) {
            return existingId
        }
        let newId = UUID().uuidString
        UserDefaults.standard.set(newId, forKey: key)
        return newId
    }
}
