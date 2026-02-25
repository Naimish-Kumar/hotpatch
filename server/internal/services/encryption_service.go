package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
)

// EncryptionService handles AES-256-GCM encryption/decryption for OTA bundles.
// The SDK-side decryption mirrors this exact format:
//
//	output = [12-byte nonce] + [ciphertext + GCM auth tag]
type EncryptionService struct{}

// NewEncryptionService creates a new EncryptionService.
func NewEncryptionService() *EncryptionService {
	return &EncryptionService{}
}

// GenerateKey generates a cryptographically secure 256-bit key as a hex string.
// This key should be securely stored and shared with the SDK out-of-band.
func (s *EncryptionService) GenerateKey() (string, error) {
	key := make([]byte, 32) // 256 bits
	if _, err := rand.Read(key); err != nil {
		return "", fmt.Errorf("failed to generate encryption key: %w", err)
	}
	return hex.EncodeToString(key), nil
}

// Encrypt encrypts plaintext data using AES-256-GCM.
//
// The output format is: [12-byte nonce][ciphertext + 16-byte GCM auth tag]
// This format is compatible with the Android and iOS SDK decryption routines.
func (s *EncryptionService) Encrypt(plaintext []byte, keyHex string) ([]byte, error) {
	key, err := hex.DecodeString(keyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid hex key: %w", err)
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("encryption key must be 256 bits (32 bytes), got %d bytes", len(key))
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	// Generate a random 12-byte nonce (standard GCM nonce size)
	nonce := make([]byte, aesGCM.NonceSize()) // 12 bytes
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Seal appends the ciphertext + auth tag to the nonce
	// Result: [nonce (12)] + [ciphertext + tag (16)]
	ciphertext := aesGCM.Seal(nonce, nonce, plaintext, nil)

	return ciphertext, nil
}

// Decrypt decrypts AES-256-GCM encrypted data.
//
// Expected input format: [12-byte nonce][ciphertext + 16-byte GCM auth tag]
// This is the same format produced by Encrypt() and consumed by the SDKs.
func (s *EncryptionService) Decrypt(encrypted []byte, keyHex string) ([]byte, error) {
	key, err := hex.DecodeString(keyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid hex key: %w", err)
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("encryption key must be 256 bits (32 bytes), got %d bytes", len(key))
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("failed to create AES cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCM: %w", err)
	}

	nonceSize := aesGCM.NonceSize() // 12 bytes
	if len(encrypted) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short: must be at least %d bytes", nonceSize)
	}

	nonce := encrypted[:nonceSize]
	ciphertext := encrypted[nonceSize:]

	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decryption failed (bad key or tampered data): %w", err)
	}

	return plaintext, nil
}

// EncryptBundle is a convenience method that encrypts bundle data for a release.
// It returns the encrypted bytes and the key ID (prefix of the hex key for tracking).
func (s *EncryptionService) EncryptBundle(bundleData []byte, keyHex string) (encryptedData []byte, keyID string, err error) {
	encryptedData, err = s.Encrypt(bundleData, keyHex)
	if err != nil {
		return nil, "", fmt.Errorf("bundle encryption failed: %w", err)
	}

	// Key ID is the first 8 hex chars of the key for reference
	if len(keyHex) >= 8 {
		keyID = keyHex[:8]
	} else {
		keyID = keyHex
	}

	return encryptedData, keyID, nil
}
