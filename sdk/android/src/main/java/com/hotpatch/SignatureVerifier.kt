package com.hotpatch

import java.io.File
import java.security.MessageDigest

object SignatureVerifier {
    fun verifyHash(file: File, expectedHash: String): Boolean {
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = file.readBytes()
        val hashBytes = digest.digest(bytes)
        val actualHash = hashBytes.joinToString("") { "%02x".format(it) }
        return actualHash.equals(expectedHash, ignoreCase = true)
    }

    fun verifySignature(file: File, signatureBase64: String, publicKeyHex: String): Boolean {
        try {
            val publicKeyBytes = hexToBytes(publicKeyHex)
            val signatureBytes =
                    android.util.Base64.decode(signatureBase64, android.util.Base64.DEFAULT)
            val fileBytes = file.readBytes()

            val spec =
                    net.i2p.crypto.eddsa.spec.EdDSANamedCurveTable.getByName(
                            net.i2p.crypto.eddsa.spec.EdDSANamedCurveTable.ED_25519
                    )
            val pubKeySpec = net.i2p.crypto.eddsa.spec.EdDSAPublicKeySpec(publicKeyBytes, spec)
            val vKey = net.i2p.crypto.eddsa.EdDSAPublicKey(pubKeySpec)

            val sgr =
                    net.i2p.crypto.eddsa.EdDSAEngine(
                            java.security.MessageDigest.getInstance(spec.hashAlgorithm)
                    )
            sgr.initVerify(vKey)
            sgr.update(fileBytes)

            return sgr.verify(signatureBytes)
        } catch (e: Exception) {
            android.util.Log.e("HotPatch", "Signature verification failed", e)
            return false
        }
    }

    private fun hexToBytes(hex: String): ByteArray {
        val result = ByteArray(hex.length / 2)
        for (i in 0 until hex.length step 2) {
            result[i / 2] = hex.substring(i, i + 2).toInt(16).toByte()
        }
        return result
    }
}
