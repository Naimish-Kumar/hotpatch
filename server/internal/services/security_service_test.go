package services

import (
	"strings"
	"testing"
)

// ── HashApiKey Tests ──────────────────────────────────────────

func TestHashApiKey_Deterministic(t *testing.T) {
	key := "hp_abc123def456"
	h1 := HashApiKey(key)
	h2 := HashApiKey(key)

	if h1 != h2 {
		t.Errorf("HashApiKey should be deterministic: got %q and %q", h1, h2)
	}
}

func TestHashApiKey_DifferentKeys(t *testing.T) {
	h1 := HashApiKey("hp_key_one")
	h2 := HashApiKey("hp_key_two")

	if h1 == h2 {
		t.Error("Different keys should produce different hashes")
	}
}

func TestHashApiKey_OutputFormat(t *testing.T) {
	hash := HashApiKey("hp_test_key_12345")

	// SHA-256 produces 64 hex characters
	if len(hash) != 64 {
		t.Errorf("SHA-256 hash should be 64 hex chars, got %d", len(hash))
	}

	// Should only contain hex characters
	for _, c := range hash {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			t.Errorf("Hash contains non-hex character: %c", c)
		}
	}
}

func TestHashApiKey_NotReversible(t *testing.T) {
	key := "hp_secret_key_do_not_store"
	hash := HashApiKey(key)

	// Obvious but important: the hash should not contain the raw key
	if strings.Contains(hash, key) {
		t.Error("Hash should not contain the raw key")
	}
}

func TestHashApiKey_EmptyInput(t *testing.T) {
	hash := HashApiKey("")

	// Even empty string should produce a valid SHA-256 hash
	if len(hash) != 64 {
		t.Errorf("Hash of empty string should be 64 chars, got %d", len(hash))
	}

	// Known SHA-256 of empty string
	expected := "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
	if hash != expected {
		t.Errorf("Hash of empty string = %q, want %q", hash, expected)
	}
}

func TestHashApiKey_Prefix_Not_Hashed_Separately(t *testing.T) {
	// The prefix shown to users (e.g. "hp_7a3d...") should be extracted
	// BEFORE hashing, since the hash is not prefix-searchable
	rawKey := "hp_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
	prefix := rawKey[:8] + "..."

	// Verify prefix is human-readable
	if !strings.HasPrefix(prefix, "hp_") {
		t.Errorf("Prefix should start with hp_, got %q", prefix)
	}
	if !strings.HasSuffix(prefix, "...") {
		t.Errorf("Prefix should end with ..., got %q", prefix)
	}

	// Verify the full hash is different from the prefix
	hash := HashApiKey(rawKey)
	if strings.HasPrefix(hash, "hp_") {
		t.Error("Hash should not start with hp_ prefix")
	}
}
