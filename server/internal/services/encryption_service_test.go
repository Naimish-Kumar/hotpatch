package services

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"testing"
)

func TestEncryptionService_GenerateKey(t *testing.T) {
	svc := NewEncryptionService()

	key, err := svc.GenerateKey()
	if err != nil {
		t.Fatalf("GenerateKey() failed: %v", err)
	}

	// Key should be 64 hex chars = 32 bytes
	if len(key) != 64 {
		t.Errorf("Expected 64 hex chars, got %d", len(key))
	}

	// Should be valid hex
	_, err = hex.DecodeString(key)
	if err != nil {
		t.Errorf("Generated key is not valid hex: %v", err)
	}

	// Two keys should be different
	key2, _ := svc.GenerateKey()
	if key == key2 {
		t.Error("Two generated keys should not be identical")
	}
}

func TestEncryptionService_EncryptDecrypt(t *testing.T) {
	svc := NewEncryptionService()
	keyHex, _ := svc.GenerateKey()

	tests := []struct {
		name      string
		plaintext []byte
	}{
		{"small data", []byte("hello world")},
		{"empty data", []byte{}},
		{"binary data", func() []byte { b := make([]byte, 1024); rand.Read(b); return b }()},
		{"large bundle", func() []byte { b := make([]byte, 1024*1024); rand.Read(b); return b }()}, // 1MB
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			encrypted, err := svc.Encrypt(tc.plaintext, keyHex)
			if err != nil {
				t.Fatalf("Encrypt() failed: %v", err)
			}

			// Encrypted should be larger than plaintext (nonce + auth tag)
			if len(tc.plaintext) > 0 && len(encrypted) <= len(tc.plaintext) {
				t.Error("Encrypted data should be larger than plaintext")
			}

			// Decrypt
			decrypted, err := svc.Decrypt(encrypted, keyHex)
			if err != nil {
				t.Fatalf("Decrypt() failed: %v", err)
			}

			if !bytes.Equal(decrypted, tc.plaintext) {
				t.Error("Decrypted data does not match original plaintext")
			}
		})
	}
}

func TestEncryptionService_WrongKey(t *testing.T) {
	svc := NewEncryptionService()
	key1, _ := svc.GenerateKey()
	key2, _ := svc.GenerateKey()

	plaintext := []byte("secret bundle data")
	encrypted, err := svc.Encrypt(plaintext, key1)
	if err != nil {
		t.Fatalf("Encrypt() failed: %v", err)
	}

	// Decrypting with wrong key should fail
	_, err = svc.Decrypt(encrypted, key2)
	if err == nil {
		t.Error("Expected decryption to fail with wrong key")
	}
}

func TestEncryptionService_TamperedData(t *testing.T) {
	svc := NewEncryptionService()
	keyHex, _ := svc.GenerateKey()

	plaintext := []byte("integrity check data")
	encrypted, _ := svc.Encrypt(plaintext, keyHex)

	// Tamper with the ciphertext (flip a byte)
	if len(encrypted) > 20 {
		encrypted[20] ^= 0xFF
	}

	_, err := svc.Decrypt(encrypted, keyHex)
	if err == nil {
		t.Error("Expected decryption to fail with tampered data")
	}
}

func TestEncryptionService_InvalidKey(t *testing.T) {
	svc := NewEncryptionService()

	// Too short key
	_, err := svc.Encrypt([]byte("data"), "aabb")
	if err == nil {
		t.Error("Expected error with short key")
	}

	// Invalid hex
	_, err = svc.Encrypt([]byte("data"), "not-hex-string-at-all-not-hex-string-at-all-not-hex-string-at-a")
	if err == nil {
		t.Error("Expected error with invalid hex key")
	}
}

func TestEncryptionService_EncryptBundle(t *testing.T) {
	svc := NewEncryptionService()
	keyHex, _ := svc.GenerateKey()

	bundleData := []byte("fake JS bundle content for React Native OTA")

	encrypted, keyID, err := svc.EncryptBundle(bundleData, keyHex)
	if err != nil {
		t.Fatalf("EncryptBundle() failed: %v", err)
	}

	// Key ID should be first 8 chars of the hex key
	if keyID != keyHex[:8] {
		t.Errorf("Expected keyID %q, got %q", keyHex[:8], keyID)
	}

	// Should be decryptable
	decrypted, err := svc.Decrypt(encrypted, keyHex)
	if err != nil {
		t.Fatalf("Decrypt() after EncryptBundle() failed: %v", err)
	}

	if !bytes.Equal(decrypted, bundleData) {
		t.Error("Decrypted bundle data does not match original")
	}
}

func TestEncryptionService_NonceUniqueness(t *testing.T) {
	svc := NewEncryptionService()
	keyHex, _ := svc.GenerateKey()

	plaintext := []byte("same plaintext")

	// Encrypt the same plaintext twice — nonces should differ → ciphertext differs
	enc1, _ := svc.Encrypt(plaintext, keyHex)
	enc2, _ := svc.Encrypt(plaintext, keyHex)

	if bytes.Equal(enc1, enc2) {
		t.Error("Two encryptions of the same plaintext should produce different ciphertexts due to unique nonces")
	}

	// Both should still decrypt correctly
	dec1, _ := svc.Decrypt(enc1, keyHex)
	dec2, _ := svc.Decrypt(enc2, keyHex)

	if !bytes.Equal(dec1, plaintext) || !bytes.Equal(dec2, plaintext) {
		t.Error("Both encryptions should decrypt to the same plaintext")
	}
}
