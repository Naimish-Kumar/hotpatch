import Foundation
#if canImport(CryptoKit)
import CryptoKit
#endif

@objc(OTAUpdateManager)
public class OTAUpdateManager: NSObject, URLSessionDelegate {
    private var apiUrl: String = ""
    private var appId: String = ""
    private var channel: String = "production"
    private var encryptionKey: String? = nil
    private var signingPublicKey: String? = nil
    private var pinnedDomain: String? = nil
    private var pinnedPublicKeyHash: String? = nil
    private let TAG = "HotPatch"
    
    private var session: URLSession!
    
    @objc public static let shared = OTAUpdateManager()
    
    @objc public func setup(url: String, id: String, ch: String, key: String? = nil, signingKey: String? = nil) {
        self.apiUrl = url
        self.appId = id
        self.channel = ch
        self.encryptionKey = key
        self.signingPublicKey = signingKey
        rebuildSession()
    }
    
    @objc public func setupCertificatePinning(domain: String, hash: String) {
        self.pinnedDomain = domain
        self.pinnedPublicKeyHash = hash
        rebuildSession()
    }
    
    private func rebuildSession() {
        let config = URLSessionConfiguration.default
        self.session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }
    
    @objc public func getBundleURL() -> URL? {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let otaDir = paths[0].appendingPathComponent("ota")
        let crashFile = otaDir.appendingPathComponent("crash_count.json")
        
        if !FileManager.default.fileExists(atPath: otaDir.path) {
            try? FileManager.default.createDirectory(at: otaDir, withIntermediateDirectories: true)
        }
        
        var count = 0
        if let data = try? Data(contentsOf: crashFile),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Int] {
            count = json["count"] ?? 0
        }
        
        if count >= 2 {
            print("[\(TAG)] Boot loop detected! Rolling back.")
            rollback()
            return nil
        }
        
        // Save incremented count
        let newJson = ["count": count + 1]
        if let newData = try? JSONSerialization.data(withJSONObject: newJson) {
            try? newData.write(to: crashFile)
        }
        
        let bundleURL = otaDir.appendingPathComponent("bundle/main.jsbundle")
        if FileManager.default.fileExists(atPath: bundleURL.path) && isVerified() {
            return bundleURL
        }
        return nil
    }
    
    private func isVerified() -> Bool {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let metadataFile = paths[0].appendingPathComponent("ota/metadata.json")
        guard let data = try? Data(contentsOf: metadataFile),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return false
        }
        return json["version"] != nil && json["hash"] != nil
    }
    
    @objc public func markSuccess() {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let crashFile = paths[0].appendingPathComponent("ota/crash_count.json")
        let json = ["count": 0]
        if let data = try? JSONSerialization.data(withJSONObject: json) {
            try? data.write(to: crashFile)
        }
    }
    
    private func rollback() {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let otaDir = paths[0].appendingPathComponent("ota")
        let bundleDir = otaDir.appendingPathComponent("bundle")
        let previousDir = otaDir.appendingPathComponent("previous")
        let metadataFile = otaDir.appendingPathComponent("metadata.json")
        
        var releaseId = ""
        if let data = try? Data(contentsOf: metadataFile),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            releaseId = json["release_id"] as? String ?? ""
        }

        if FileManager.default.fileExists(atPath: previousDir.path) {
            try? FileManager.default.removeItem(at: bundleDir)
            try? FileManager.default.moveItem(at: previousDir, to: bundleDir)
            
            if !releaseId.isEmpty {
                reportInstallation(releaseId: releaseId, status: "rolled_back", isPatch: false, downloadSize: 0)
            }
        } else {
            try? FileManager.default.removeItem(at: bundleDir)
            try? FileManager.default.removeItem(at: metadataFile)
        }
    }
    
    func checkForUpdate(version: String, deviceId: String, completion: @escaping ([String: Any]?) -> Void) {
        UserDefaults.standard.set(deviceId, forKey: "HotPatch_DeviceId")
        let urlString = "\(apiUrl)/update/check?appId=\(appId)&deviceId=\(deviceId)&version=\(version)&platform=ios&channel=\(channel)"
        guard let url = URL(string: urlString) else {
            completion(nil)
            return
        }
        
        var request = URLRequest(url: url)
        request.addValue(appId, forHTTPHeaderField: "X-App-Key")
        
        session.dataTask(with: request) { data, response, error in
            guard let data = data, error == nil else {
                completion(nil)
                return
            }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let available = json["updateAvailable"] as? Bool, available {
                completion(json)
            } else {
                completion(nil)
            }
        }.resume()
    }
    
    func downloadAndApply(updateJson: [String: Any], completion: @escaping (Bool) -> Void) {
        let bundleUrlStr = updateJson["bundleUrl"] as? String ?? ""
        guard let bundleUrl = URL(string: bundleUrlStr) else {
            completion(false)
            return
        }
        
        session.downloadTask(with: bundleUrl) { location, response, error in
            guard let location = location, error == nil else {
                completion(false)
                return
            }
            
            do {
                let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
                let otaDir = paths[0].appendingPathComponent("ota")
                let pendingDir = otaDir.appendingPathComponent("pending")
                let bundleDir = otaDir.appendingPathComponent("bundle")
                let previousDir = otaDir.appendingPathComponent("previous")
                
                if !FileManager.default.fileExists(atPath: pendingDir.path) {
                    try FileManager.default.createDirectory(at: pendingDir, withIntermediateDirectories: true)
                }
                
                let downloadedFile = pendingDir.appendingPathComponent("bundle.tmp")
                if FileManager.default.fileExists(atPath: downloadedFile.path) {
                    try FileManager.default.removeItem(at: downloadedFile)
                }
                try FileManager.default.moveItem(at: location, to: downloadedFile)
                
                var finalZip = downloadedFile
                
                // Step A: Handle Differential Patch
                if let isPatch = updateJson["isPatch"] as? Bool, isPatch {
                    print("[\(self.TAG)] Applying differential patch...")
                    let currentBundleZip = otaDir.appendingPathComponent("bundle.zip")
                    let patchedZip = pendingDir.appendingPathComponent("bundle.patched.zip")
                    try self.applyPatch(oldFile: currentBundleZip, patchFile: downloadedFile, outputFile: patchedZip)
                    finalZip = patchedZip
                }
                
                // Step C: Verify Integrity
                let expectedHash = updateJson["hash"] as? String ?? ""
                if !expectedHash.isEmpty && !HashUtils.verifyHash(fileURL: finalZip, expectedHash: expectedHash) {
                    print("[\(self.TAG)] Hash verification failed!")
                    completion(false)
                    return
                }
                
                let signature = updateJson["signature"] as? String ?? ""
                if !signature.isEmpty, let publicKey = self.signingPublicKey {
                    if !SignatureVerifier.verifySignature(fileURL: finalZip, signatureBase64: signature, publicKeyHex: publicKey) {
                        print("[\(self.TAG)] Signature verification failed!")
                        completion(false)
                        return
                    }
                    print("[\(self.TAG)] Authenticity verified ✓")
                }
               
                // Step B: Handle Decryption
                if let isEncrypted = updateJson["isEncrypted"] as? Bool, isEncrypted {
                    print("[\(self.TAG)] Decrypting bundle...")
                    let decryptedZip = pendingDir.appendingPathComponent("bundle.decrypted.zip")
                    try self.decryptFile(at: finalZip, to: decryptedZip)
                    finalZip = decryptedZip
                }
                
                // Backup current
                if FileManager.default.fileExists(atPath: bundleDir.path) {
                    if FileManager.default.fileExists(atPath: previousDir.path) {
                        try FileManager.default.removeItem(at: previousDir)
                    }
                    try FileManager.default.moveItem(at: bundleDir, to: previousDir)
                }
                
                // Unzip or Move (Simplified)
                try FileManager.default.createDirectory(at: bundleDir, withIntermediateDirectories: true)
                // In reality, use a Zip library. For now, we assume the ZIP content is main.jsbundle
                // or we use a helper to extract.
                try self.unzip(file: finalZip, to: bundleDir)
                
                // Save metadata
                let metadata: [String: Any] = [
                    "version": updateJson["version"] as? String ?? "",
                    "hash": updateJson["hash"] as? String ?? "",
                    "release_id": updateJson["id"] as? String ?? updateJson["release_id"] as? String ?? "",
                    "installed_at": Date().timeIntervalSince1970
                ]
                if let metaData = try? JSONSerialization.data(withJSONObject: metadata) {
                    try? metaData.write(to: otaDir.appendingPathComponent("metadata.json"))
                }
                
                // Save zip for next diff
                let savedZip = otaDir.appendingPathComponent("bundle.zip")
                if FileManager.default.fileExists(atPath: savedZip.path) {
                    try FileManager.default.removeItem(at: savedZip)
                }
                try FileManager.default.copyItem(at: finalZip, to: savedZip)
                
                print("[\(self.TAG)] Update applied successfully.")
                
                // Report installation
                let releaseId = updateJson["id"] as? String ?? updateJson["release_id"] as? String ?? ""
                let isPatch = updateJson["isPatch"] as? Bool ?? false
                let downloadSize = try? FileManager.default.attributesOfItem(atPath: downloadedFile.path)[.size] as? Int64 ?? 0
                
                self.reportInstallation(releaseId: releaseId, status: "applied", isPatch: isPatch, downloadSize: downloadSize ?? 0)
                
                if let mandatory = updateJson["mandatory"] as? Bool, mandatory {
                    print("[\(self.TAG)] Mandatory update! Triggering reload...")
                    self.triggerReload()
                }
                
                completion(true)
                
            } catch {
                print("[\(self.TAG)] Update failed: \(error)")
                completion(false)
            }
        }.resume()
    }
    
    private func decryptFile(at source: URL, to destination: URL) throws {
        guard let keyHex = self.encryptionKey else {
            throw NSError(domain: "HotPatch", code: 400, userInfo: [NSLocalizedDescriptionKey: "Encryption key missing"])
        }
        
        let fileData = try Data(contentsOf: source)
        if fileData.count < 12 {
            throw NSError(domain: "HotPatch", code: 400, userInfo: [NSLocalizedDescriptionKey: "Invalid encrypted bundle"])
        }
        
        let nonceData = fileData.subdata(in: 0..<12)
        let ciphertext = fileData.subdata(in: 12..<fileData.count)
        
        let keyData = Data(hexString: keyHex)
        
        // CryptoKit Implementation
        #if canImport(CryptoKit)
        let key = SymmetricKey(data: keyData)
        let sealedBox = try AES.GCM.SealedBox(nonce: AES.GCM.Nonce(data: nonceData), ciphertext: ciphertext, tag: ciphertext.suffix(16))
        // Note: Our CLI appends tag to ciphertext if using standard Rust aes-gcm. 
        // We need to ensure the format matches. Standard AES-GCM tag is 16 bytes.
        // If the Rust implementation uses internal tag handling, ciphertext might include it at the end.
        
        // Adjusting ciphertext/tag split if necessary.
        let actualCiphertext = ciphertext.prefix(ciphertext.count - 16)
        let tag = ciphertext.suffix(16)
        let properBox = try AES.GCM.SealedBox(nonce: AES.GCM.Nonce(data: nonceData), ciphertext: actualCiphertext, tag: tag)
        
        let decryptedData = try AES.GCM.open(properBox, using: key)
        try decryptedData.write(to: destination)
        #else
        throw NSError(domain: "HotPatch", code: 500, userInfo: [NSLocalizedDescriptionKey: "CryptoKit not available"])
        #endif
    }
    
    private func reportInstallation(releaseId: String, status: String, isPatch: Bool, downloadSize: Int64) {
        guard let deviceId = UserDefaults.standard.string(forKey: "HotPatch_DeviceId") else { return }
        let urlString = "\(apiUrl)/installations"
        guard let url = URL(string: urlString) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue(appId, forHTTPHeaderField: "X-App-Key")
        
        let body: [String: Any] = [
            "device_id": deviceId,
            "release_id": releaseId,
            "status": status,
            "is_patch": isPatch,
            "download_size": downloadSize
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        // Use self.session (not URLSession.shared) so certificate pinning is applied
        session.dataTask(with: request).resume()
    }

    private func applyPatch(oldFile: URL, patchFile: URL, outputFile: URL) throws {
        print("[\(TAG)] Applying binary patch from \(oldFile.lastPathComponent)")
        try PatchUtils.applyPatch(oldURL: oldFile, patchURL: patchFile, newURL: outputFile)
    }
    
    private func unzip(file: URL, to directory: URL) throws {
        // Use the system `unzip` command available on all Apple platforms
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
        process.arguments = ["-o", file.path, "-d", directory.path]
        process.standardOutput = FileHandle.nullDevice
        process.standardError = FileHandle.nullDevice
        
        try process.run()
        process.waitUntilExit()
        
        guard process.terminationStatus == 0 else {
            throw NSError(
                domain: "HotPatch",
                code: Int(process.terminationStatus),
                userInfo: [NSLocalizedDescriptionKey: "Failed to unzip bundle (exit code \(process.terminationStatus))"]
            )
        }
        
        print("[\(TAG)] Bundle extracted to \(directory.path)")
    }
    
    private func triggerReload() {
        DispatchQueue.main.async {
            // Post the standard React Native reload notification
            NotificationCenter.default.post(
                name: NSNotification.Name("RCTReloadNotification"),
                object: nil
            )
        }
    }

    // MARK: - URLSessionDelegate (Certificate Pinning)
    
    public func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        
        guard let serverTrust = challenge.protectionSpace.serverTrust,
              challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust else {
            completionHandler(.performDefaultHandling, nil)
            return
        }
        
        let host = challenge.protectionSpace.host
        
        // Check if we have pinning configured for this host (or if host ends with pinnedDomain)
        if let pinnedDomain = self.pinnedDomain,
           let expectedHash = self.pinnedPublicKeyHash,
           host.hasSuffix(pinnedDomain) {
            
            // Validate server trust
            var error: CFError?
            if SecTrustEvaluateWithError(serverTrust, &error) {
                if let serverCertificate = SecTrustGetCertificateAtIndex(serverTrust, 0) {
                    let serverPublicKey = SecCertificateCopyKey(serverCertificate)
                    if let publicKeyData = SecKeyCopyExternalRepresentation(serverPublicKey!, &error) as Data? {
                        let hash = SHA256.hash(data: publicKeyData)
                        let actualHash = hash.compactMap { String(format: "%02x", $0) }.joined()
                        
                        if actualHash.lowercased() == expectedHash.lowercased() {
                            print("[\(TAG)] Certificate pinning verified for \(host) ✓")
                            completionHandler(.useCredential, URLCredential(trust: serverTrust))
                            return
                        } else {
                            print("[\(TAG)] Certificate pinning FAILED for \(host). Expected: \(expectedHash), Got: \(actualHash)")
                            completionHandler(.cancelAuthenticationChallenge, nil)
                            return
                        }
                    }
                }
            }
            
            print("[\(TAG)] Certificate trust evaluation failed for \(host)")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Default handling for other domains
        completionHandler(.performDefaultHandling, nil)
    }
}

extension Data {
    init(hexString: String) {
        var str = hexString
        if str.count % 2 != 0 { str = "0" + str }
        let bytes = stride(from: 0, to: str.count, by: 2).map {
            UInt8(str[str.index(str.startIndex, offsetBy: $0)...str.index(str.startIndex, offsetBy: $0 + 1)], radix: 16) ?? 0
        }
        self.init(bytes)
    }
}

extension String {
    subscript(bounds: CountableClosedRange<Int>) -> String {
        let start = index(startIndex, offsetBy: bounds.lowerBound)
        let end = index(startIndex, offsetBy: bounds.upperBound)
        return String(self[start...end])
    }
}
