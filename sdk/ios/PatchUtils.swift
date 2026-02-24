import Foundation
import Compression

/**
 * BSDIFF40 patch application in Swift.
 * Reconstructs 'newFile' using 'oldFile' and 'patchFile'.
 *
 * The patch format is:
 *   - Header: "BSDIFF40" (8 bytes)
 *   - Control block length (8 bytes, little-endian int64)
 *   - Diff block length (8 bytes, little-endian int64)
 *   - New file size (8 bytes, little-endian int64)
 *   - Control block (bzip2 compressed)
 *   - Diff block (bzip2 compressed)
 *   - Extra block (bzip2 compressed)
 *
 * Note: Since Apple's Compression framework supports LZMA/ZLIB/LZ4 but not BZip2 natively,
 * we use a raw decompression approach. For production with standard bsdiff patches,
 * link libbz2.tbd or use a BZip2 Swift wrapper.
 */
class PatchUtils {
    
    enum PatchError: Error, LocalizedError {
        case invalidHeader
        case corruptPatch(String)
        case decompressionFailed(String)
        case sizeMismatch(expected: Int64, actual: Int)
        
        var errorDescription: String? {
            switch self {
            case .invalidHeader:
                return "Invalid BSDIFF40 header"
            case .corruptPatch(let msg):
                return "Corrupt patch: \(msg)"
            case .decompressionFailed(let msg):
                return "Decompression failed: \(msg)"
            case .sizeMismatch(let expected, let actual):
                return "Size mismatch: expected \(expected), got \(actual)"
            }
        }
    }

    /// Apply a BSDIFF40 patch to reconstruct the new file.
    /// - Parameters:
    ///   - oldURL: Path to the original (base) file
    ///   - patchURL: Path to the binary patch file
    ///   - newURL: Path where the reconstructed file will be written
    static func applyPatch(oldURL: URL, patchURL: URL, newURL: URL) throws {
        let oldData = try Data(contentsOf: oldURL)
        let patchData = try Data(contentsOf: patchURL)
        
        // Minimum patch size: 32 bytes header
        guard patchData.count >= 32 else {
            throw PatchError.corruptPatch("Patch file too small (\(patchData.count) bytes)")
        }
        
        // ── Header: BSDIFF40 (8 bytes) ──
        let header = patchData.subdata(in: 0..<8)
        guard String(data: header, encoding: .ascii) == "BSDIFF40" else {
            throw PatchError.invalidHeader
        }
        
        // ── Lengths (3 x int64, little-endian) ──
        var offset = 8
        let ctrlBlockLen = readInt64(patchData, at: &offset)
        let diffBlockLen = readInt64(patchData, at: &offset)
        let newFileSize = readInt64(patchData, at: &offset)
        
        guard ctrlBlockLen >= 0, diffBlockLen >= 0, newFileSize >= 0 else {
            throw PatchError.corruptPatch("Negative block lengths")
        }
        
        let headerSize = 32 // 8 + 8 + 8 + 8
        let ctrlEnd = headerSize + Int(ctrlBlockLen)
        let diffEnd = ctrlEnd + Int(diffBlockLen)
        
        guard diffEnd <= patchData.count else {
            throw PatchError.corruptPatch("Block lengths exceed patch size")
        }
        
        // ── Extract raw block data ──
        // Note: Standard bsdiff compresses each block with bzip2.
        // qbsdiff (used by our CLI) may use different compression.
        // We handle both raw and bzip2 compressed blocks.
        let ctrlBlockRaw = patchData.subdata(in: headerSize..<ctrlEnd)
        let diffBlockRaw = patchData.subdata(in: ctrlEnd..<diffEnd)
        let extraBlockRaw = patchData.subdata(in: diffEnd..<patchData.count)
        
        // Try to decompress; if decompression fails, assume raw data
        let ctrlBlock = decompressIfNeeded(ctrlBlockRaw)
        let diffBlock = decompressIfNeeded(diffBlockRaw)
        let extraBlock = decompressIfNeeded(extraBlockRaw)
        
        // ── Reconstruction ──
        var newData = Data(count: Int(newFileSize))
        var oldPos = 0
        var newPos = 0
        var ctrlOffset = 0
        var diffOffset = 0
        var extraOffset = 0
        
        while newPos < Int(newFileSize) {
            // Read control tuple: (addLen, copyLen, seekLen) — 3 x int64
            guard ctrlOffset + 24 <= ctrlBlock.count else {
                throw PatchError.corruptPatch("Control block exhausted at newPos=\(newPos)")
            }
            
            var ctrlPos = ctrlOffset
            let addLen = readInt64(ctrlBlock, at: &ctrlPos)
            let copyLen = readInt64(ctrlBlock, at: &ctrlPos)
            let seekLen = readSignedInt64(ctrlBlock, at: &ctrlPos)
            ctrlOffset = ctrlPos
            
            // Sanity checks
            guard addLen >= 0, newPos + Int(addLen) <= Int(newFileSize) else {
                throw PatchError.corruptPatch("addLen out of bounds: \(addLen)")
            }
            guard diffOffset + Int(addLen) <= diffBlock.count else {
                throw PatchError.corruptPatch("Diff block exhausted")
            }
            
            // Add: newData[newPos..newPos+addLen] = oldData[oldPos..] + diffBlock[diffOffset..]
            for i in 0..<Int(addLen) {
                let oldByte: UInt8 = (oldPos + i >= 0 && oldPos + i < oldData.count) ? oldData[oldPos + i] : 0
                let diffByte: UInt8 = diffBlock[diffOffset + i]
                newData[newPos + i] = oldByte &+ diffByte
            }
            newPos += Int(addLen)
            oldPos += Int(addLen)
            diffOffset += Int(addLen)
            
            // Copy: newData[newPos..newPos+copyLen] = extraBlock[extraOffset..]
            guard copyLen >= 0, newPos + Int(copyLen) <= Int(newFileSize) else {
                throw PatchError.corruptPatch("copyLen out of bounds: \(copyLen)")
            }
            guard extraOffset + Int(copyLen) <= extraBlock.count else {
                throw PatchError.corruptPatch("Extra block exhausted")
            }
            
            if Int(copyLen) > 0 {
                newData.replaceSubrange(newPos..<newPos + Int(copyLen),
                                        with: extraBlock.subdata(in: extraOffset..<extraOffset + Int(copyLen)))
            }
            newPos += Int(copyLen)
            extraOffset += Int(copyLen)
            
            // Seek: adjust oldPos
            oldPos += Int(seekLen)
        }
        
        guard newPos == Int(newFileSize) else {
            throw PatchError.sizeMismatch(expected: newFileSize, actual: newPos)
        }
        
        try newData.write(to: newURL)
    }
    
    // MARK: - Private Helpers
    
    /// Read an unsigned int64 (little-endian) from Data.
    private static func readInt64(_ data: Data, at offset: inout Int) -> Int64 {
        guard offset + 8 <= data.count else { return 0 }
        let sub = data.subdata(in: offset..<offset+8)
        offset += 8
        return sub.withUnsafeBytes { $0.load(as: Int64.self).littleEndian }
    }
    
    /// Read a signed int64 using the bsdiff encoding:
    /// Bit 63 is the sign bit in bsdiff's custom encoding.
    private static func readSignedInt64(_ data: Data, at offset: inout Int) -> Int64 {
        guard offset + 8 <= data.count else { return 0 }
        let sub = data.subdata(in: offset..<offset+8)
        offset += 8
        var value = sub.withUnsafeBytes { $0.load(as: Int64.self).littleEndian }
        
        // bsdiff encodes sign in bit 63 of byte 7
        if value & (1 << 63) != 0 {
            value = -(value & ~(1 << 63))
        }
        return value
    }
    
    /// Attempt to decompress data using bzip2 or return raw data if not compressed.
    /// BZip2 data starts with "BZ" magic bytes.
    private static func decompressIfNeeded(_ data: Data) -> Data {
        guard data.count >= 2 else { return data }
        
        // Check for BZip2 magic bytes "BZ"
        if data[data.startIndex] == 0x42 && data[data.startIndex + 1] == 0x5A {
            // Attempt BZip2 decompression using system bzip2  
            if let decompressed = decompressBzip2(data) {
                return decompressed
            }
        }
        
        // Return raw data if not bzip2 or decompression failed
        return data
    }
    
    /// Decompress BZip2 data by shelling out to bunzip2 (available on all Apple platforms).
    private static func decompressBzip2(_ data: Data) -> Data? {
        let tempDir = FileManager.default.temporaryDirectory
        let compressedFile = tempDir.appendingPathComponent(UUID().uuidString + ".bz2")
        let decompressedFile = tempDir.appendingPathComponent(UUID().uuidString + ".raw")
        
        do {
            try data.write(to: compressedFile)
            
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/usr/bin/bunzip2")
            process.arguments = ["-k", "-c", compressedFile.path]
            
            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = FileHandle.nullDevice
            
            try process.run()
            process.waitUntilExit()
            
            let decompressedData = pipe.fileHandleForReading.readDataToEndOfFile()
            
            // Cleanup
            try? FileManager.default.removeItem(at: compressedFile)
            
            return decompressedData.isEmpty ? nil : decompressedData
        } catch {
            try? FileManager.default.removeItem(at: compressedFile)
            return nil
        }
    }
}
