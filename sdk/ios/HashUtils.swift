import Foundation
import CommonCrypto

struct HashUtils {
    static func verifyHash(fileURL: URL, expectedHash: String) -> Boolean {
        guard let data = try? Data(contentsOf: fileURL) else { return false }
        let hash = sha256(data: data)
        return hash.lowercased() == expectedHash.lowercased()
    }
    
    private static func sha256(data: Data) -> String {
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}
