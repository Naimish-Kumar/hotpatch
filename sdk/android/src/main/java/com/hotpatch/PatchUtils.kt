package com.hotpatch

import java.io.*
import org.apache.commons.compress.compressors.bzip2.BZip2CompressorInputStream

object PatchUtils {
    /**
     * Standard implementation of bspatch. Reconstructs 'newFile' using 'oldFile' and 'patchFile'.
     */
    fun applyPatch(oldFile: File, patchFile: File, newFile: File) {
        val oldData = oldFile.readBytes()
        val patchIn = DataInputStream(BufferedInputStream(FileInputStream(patchFile)))

        // Header: BSDIFF40 (8 bytes)
        val header = ByteArray(8)
        patchIn.readFully(header)
        if (String(header) != "BSDIFF40") {
            throw IOException("Invalid patch header: " + String(header))
        }

        // lengths: ctrlBlockLen, diffBlockLen, newFileSize (8 bytes each, little-endian)
        val ctrlBlockLen = readLong(patchIn)
        val diffBlockLen = readLong(patchIn)
        val newFileSize = readLong(patchIn)

        if (ctrlBlockLen < 0 || diffBlockLen < 0 || newFileSize < 0) {
            throw IOException("Invalid block lengths in patch")
        }

        val newData = ByteArray(newFileSize.toInt())

        // Setup the 3 streams (control, diff, extra)
        // Note: In standard BSDIFF40, these are just concatenated after the header.
        // But bzip2 streams have their own headers and markers.
        // The DataInputStream will read exactly the right amount if we wrap it.

        val patchFileIn = FileInputStream(patchFile)
        patchFileIn.skip(32) // Skip header (8) + 3 lengths (24)

        val ctrlIn = BZip2CompressorInputStream(BufferedInputStream(patchFileIn))
        val diffIn =
                BZip2CompressorInputStream(
                        BufferedInputStream(
                                FileInputStream(patchFile).apply { skip(32 + ctrlBlockLen) }
                        )
                )
        val extraIn =
                BZip2CompressorInputStream(
                        BufferedInputStream(
                                FileInputStream(patchFile).apply {
                                    skip(32 + ctrlBlockLen + diffBlockLen)
                                }
                        )
                )

        var oldPos = 0
        var newPos = 0

        val ctrlDataIn = DataInputStream(ctrlIn)

        while (newPos < newFileSize) {
            // Read control tuple
            val diffLen = readLong(ctrlDataIn).toInt()
            val extraLen = readLong(ctrlDataIn).toInt()
            val seekDist = readLong(ctrlDataIn).toInt()

            if (newPos + diffLen > newFileSize) {
                throw IOException("Corrupt patch: diffLen exceeds newFileSize")
            }

            // Read diff block data and add to oldData
            readFully(diffIn, newData, newPos, diffLen)
            for (i in 0 until diffLen) {
                if (oldPos + i >= 0 && oldPos + i < oldData.size) {
                    newData[newPos + i] = (newData[newPos + i] + oldData[oldPos + i]).toByte()
                }
            }
            newPos += diffLen
            oldPos += diffLen

            // Read extra block data
            if (newPos + extraLen > newFileSize) {
                throw IOException("Corrupt patch: extraLen exceeds newFileSize")
            }
            readFully(extraIn, newData, newPos, extraLen)
            newPos += extraLen
            oldPos += seekDist
        }

        ctrlIn.close()
        diffIn.close()
        extraIn.close()
        patchIn.close()

        FileOutputStream(newFile).use { it.write(newData) }
    }

    private fun readLong(input: DataInput): Long {
        val b = ByteArray(8)
        input.readFully(b)
        // Little-endian read
        var result: Long = 0
        for (i in 7 downTo 0) {
            result = (result shl 8) or (b[i].toLong() and 0xFF)
        }
        return result
    }

    private fun readFully(input: InputStream, buffer: ByteArray, offset: Int, length: Int) {
        var totalRead = 0
        while (totalRead < length) {
            val read = input.read(buffer, offset + totalRead, length - totalRead)
            if (read == -1) throw EOFException()
            totalRead += read
        }
    }
}
