import Foundation
#if canImport(CryptoKit)
import CryptoKit
#endif

/// Handles Ed25519 signature verification for OTA bundles.
/// Hash verification is handled by HashUtils.
class SignatureVerifier {
    
    /// Verifies an Ed25519 signature against a file using the provided public key.
    /// - Parameters:
    ///   - fileURL: URL to the file to verify
    ///   - signatureBase64: Base64-encoded Ed25519 signature
    ///   - publicKeyHex: Hex-encoded Ed25519 public key (32 bytes)
    /// - Returns: `true` if the signature is valid
    static func verifySignature(fileURL: URL, signatureBase64: String, publicKeyHex: String) -> Bool {
        #if canImport(CryptoKit)
        guard let fileData = try? Data(contentsOf: fileURL),
              let signatureData = Data(base64Encoded: signatureBase64) else {
            return false
        }
        
        do {
            let publicKeyData = Data(hexString: publicKeyHex)
            let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: publicKeyData)
            return publicKey.isValidSignature(signatureData, for: fileData)
        } catch {
            print("[HotPatch] Signature verification error: \(error)")
            return false
        }
        #else
        print("[HotPatch] CryptoKit not available — signature verification skipped")
        return false
        #endif
    }
}
