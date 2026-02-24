package com.hotpatch

import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

object HashUtils {
    fun verifyHash(file: File, expectedHash: String): Boolean {
        val hash = sha256(file)
        return hash.equals(expectedHash, ignoreCase = true)
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val inputStream = FileInputStream(file)
        val buffer = ByteArray(8192)
        var bytesRead = inputStream.read(buffer)
        while (bytesRead != -1) {
            digest.update(buffer, 0, bytesRead)
            bytesRead = inputStream.read(buffer)
        }
        inputStream.close()
        return bytesToHex(digest.digest())
    }

    private fun bytesToHex(bytes: ByteArray): String {
        val hexChars = "0123456789abcdef"
        val builder = StringBuilder()
        for (b in bytes) {
            val i = b.toInt() and 0xFF
            builder.append(hexChars[i shr 4])
            builder.append(hexChars[i and 0x0F])
        }
        return builder.toString()
    }
}
