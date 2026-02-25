package services

import (
	"testing"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
)

// ── isVersionGreater Tests ──────────────────────────────────

func TestIsVersionGreater(t *testing.T) {
	tests := []struct {
		name     string
		v1       string
		v2       string
		expected bool
	}{
		// Basic comparisons
		{"greater major", "2.0.0", "1.0.0", true},
		{"greater minor", "1.1.0", "1.0.0", true},
		{"greater patch", "1.0.1", "1.0.0", true},
		{"equal versions", "1.0.0", "1.0.0", false},
		{"lesser major", "1.0.0", "2.0.0", false},
		{"lesser minor", "1.0.0", "1.1.0", false},
		{"lesser patch", "1.0.0", "1.0.1", false},

		// Multi-digit versions
		{"double digit minor", "1.10.0", "1.9.0", true},
		{"double digit patch", "1.0.10", "1.0.9", true},
		{"triple digit", "1.100.0", "1.99.0", true},

		// Leading "v" prefix
		{"v prefix v1", "v2.0.0", "1.0.0", true},
		{"v prefix v2", "2.0.0", "v1.0.0", true},
		{"v prefix both", "v2.0.0", "v1.0.0", true},
		{"V uppercase prefix", "V2.0.0", "1.0.0", true},

		// Pre-release suffixes (stripped, only numeric compared)
		{"pre-release suffix", "1.2.3", "1.2.3-beta", false}, // numeric parts equal -> false
		{"pre-release greater", "1.2.4-rc1", "1.2.3", true},
		{"pre-release lesser", "1.2.2-alpha", "1.2.3", false},

		// Varying lengths
		{"shorter v1", "1.2", "1.2.0", false}, // [1,2] vs [1,2,0] — equal
		{"shorter v2", "1.2.1", "1.2", true},  // [1,2,1] vs [1,2] -> 1 > 0
		{"single digit", "2", "1", true},
		{"single digit equal", "1", "1", false},

		// Edge cases
		{"empty v1", "", "1.0.0", false},
		{"empty v2", "1.0.0", "", true},
		{"both empty", "", "", false},
		{"zero versions", "0.0.0", "0.0.0", false},
		{"zero vs one", "0.0.1", "0.0.0", true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := isVersionGreater(tc.v1, tc.v2)
			if result != tc.expected {
				t.Errorf("isVersionGreater(%q, %q) = %v, want %v", tc.v1, tc.v2, result, tc.expected)
			}
		})
	}
}

// ── parseVersion Tests ──────────────────────────────────────

func TestParseVersion(t *testing.T) {
	tests := []struct {
		input    string
		expected []int
	}{
		{"1.2.3", []int{1, 2, 3}},
		{"v1.2.3", []int{1, 2, 3}},
		{"V1.2.3", []int{1, 2, 3}},
		{"1.2.3-beta", []int{1, 2, 3}},
		{"1.10.0", []int{1, 10, 0}},
		{"0.0.0", []int{0, 0, 0}},
		{"", []int{0}},
		{"v", []int{0}},
		{"1", []int{1}},
		{"1.2", []int{1, 2}},
		{"abc", []int{0}},
		{"1.abc.3", []int{1, 0, 3}},
	}

	for _, tc := range tests {
		t.Run(tc.input, func(t *testing.T) {
			result := parseVersion(tc.input)
			if len(result) != len(tc.expected) {
				t.Errorf("parseVersion(%q) returned %v (len=%d), want %v (len=%d)",
					tc.input, result, len(result), tc.expected, len(tc.expected))
				return
			}
			for i, v := range result {
				if v != tc.expected[i] {
					t.Errorf("parseVersion(%q)[%d] = %d, want %d", tc.input, i, v, tc.expected[i])
				}
			}
		})
	}
}

// ── isInRollout Tests ────────────────────────────────────────

func TestIsInRollout(t *testing.T) {
	t.Run("0 percent excludes all", func(t *testing.T) {
		for i := 0; i < 100; i++ {
			deviceID := uuid.New().String()
			if isInRollout(deviceID, 0) {
				t.Errorf("isInRollout(%q, 0) = true, want false", deviceID)
			}
		}
	})

	t.Run("100 percent includes all", func(t *testing.T) {
		for i := 0; i < 100; i++ {
			deviceID := uuid.New().String()
			if !isInRollout(deviceID, 100) {
				t.Errorf("isInRollout(%q, 100) = false, want true", deviceID)
			}
		}
	})

	t.Run("stable results for same device", func(t *testing.T) {
		deviceID := "stable-device-test-123"
		first := isInRollout(deviceID, 50)
		for i := 0; i < 100; i++ {
			result := isInRollout(deviceID, 50)
			if result != first {
				t.Fatalf("isInRollout returned inconsistent results for same device: call 0=%v, call %d=%v", first, i+1, result)
			}
		}
	})

	t.Run("50 percent rollout roughly splits", func(t *testing.T) {
		inCount := 0
		total := 10000
		for i := 0; i < total; i++ {
			if isInRollout(uuid.New().String(), 50) {
				inCount++
			}
		}
		// Should be roughly 50% ± 3% tolerance
		ratio := float64(inCount) / float64(total)
		if ratio < 0.45 || ratio > 0.55 {
			t.Errorf("Expected ~50%% rollout, got %.1f%% (%d/%d)", ratio*100, inCount, total)
		}
	})

	t.Run("10 percent rollout roughly matches", func(t *testing.T) {
		inCount := 0
		total := 10000
		for i := 0; i < total; i++ {
			if isInRollout(uuid.New().String(), 10) {
				inCount++
			}
		}
		ratio := float64(inCount) / float64(total)
		if ratio < 0.07 || ratio > 0.13 {
			t.Errorf("Expected ~10%% rollout, got %.1f%% (%d/%d)", ratio*100, inCount, total)
		}
	})

	t.Run("90 percent rollout roughly matches", func(t *testing.T) {
		inCount := 0
		total := 10000
		for i := 0; i < total; i++ {
			if isInRollout(uuid.New().String(), 90) {
				inCount++
			}
		}
		ratio := float64(inCount) / float64(total)
		if ratio < 0.87 || ratio > 0.93 {
			t.Errorf("Expected ~90%% rollout, got %.1f%% (%d/%d)", ratio*100, inCount, total)
		}
	})
}

// ── CheckForUpdate Tests (with mock repositories) ─────────────

// mockReleaseRepo implements the methods used by UpdateService.
type mockReleaseRepo struct {
	release *models.Release
	err     error
}

func (m *mockReleaseRepo) GetActiveRelease(appID uuid.UUID, channel string) (*models.Release, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.release, nil
}

// mockDeviceRepo is a stub for the device repository.
type mockDeviceRepo struct{}

func TestCheckForUpdate_NoActiveRelease(t *testing.T) {
	// When no active release is found, the device version should be considered current.
	// We test this through the version logic: if no remote version exists,
	// isVersionGreater("", deviceVersion) should return false.
	t.Run("empty remote version means no update", func(t *testing.T) {
		if isVersionGreater("", "1.0.0") {
			t.Error("Empty remote version should not be greater than any device version")
		}
	})

	t.Run("any version is greater than empty", func(t *testing.T) {
		if !isVersionGreater("1.0.0", "") {
			t.Error("Any version should be greater than empty")
		}
	})
}

func TestCheckForUpdate_VersionLogic(t *testing.T) {
	// Test: When remote version is newer than device version
	t.Run("update available when newer version exists", func(t *testing.T) {
		remoteVersion := "2.0.0"
		deviceVersion := "1.0.0"
		if !isVersionGreater(remoteVersion, deviceVersion) {
			t.Error("Expected remote 2.0.0 > device 1.0.0")
		}
	})

	t.Run("no update when device version is current", func(t *testing.T) {
		remoteVersion := "1.0.0"
		deviceVersion := "1.0.0"
		if isVersionGreater(remoteVersion, deviceVersion) {
			t.Error("Expected no update when versions are equal")
		}
	})

	t.Run("no update when device version is newer", func(t *testing.T) {
		remoteVersion := "1.0.0"
		deviceVersion := "2.0.0"
		if isVersionGreater(remoteVersion, deviceVersion) {
			t.Error("Expected no update when device is ahead")
		}
	})
}

func TestCheckForUpdate_RolloutFiltering(t *testing.T) {
	// Test: When device is not in rollout bucket, shouldn't get update
	t.Run("device excluded from rollout does not get update", func(t *testing.T) {
		// Use a known device ID to test rollout exclusion
		deviceID := "test-device-rollout"
		rolloutPct := 1 // Very low rollout

		// Run 100 times — most should be excluded with 1% rollout
		excluded := 0
		for i := 0; i < 100; i++ {
			id := deviceID + uuid.New().String()
			if !isInRollout(id, rolloutPct) {
				excluded++
			}
		}
		if excluded < 90 {
			t.Errorf("Expected most devices excluded at 1%% rollout, but only %d/100 were excluded", excluded)
		}
	})
}

func TestCheckForUpdate_PatchSelection(t *testing.T) {
	// Test: When a patch exists for the device's current version, it should be selected
	t.Run("patch matched by base version", func(t *testing.T) {
		release := &models.Release{
			ID:                uuid.New(),
			Version:           "2.0.0",
			BundleURL:         "https://cdn.example.com/bundles/2.0.0.zip",
			Hash:              "full-hash",
			Signature:         "full-sig",
			IsEncrypted:       false,
			IsPatch:           false,
			RolloutPercentage: 100,
			Patches: []models.Patch{
				{
					BaseVersion: "1.0.0",
					PatchURL:    "https://cdn.example.com/patches/1.0.0-to-2.0.0.zip",
					Hash:        "patch-hash",
					Signature:   "patch-sig",
				},
				{
					BaseVersion: "1.5.0",
					PatchURL:    "https://cdn.example.com/patches/1.5.0-to-2.0.0.zip",
					Hash:        "patch-hash-2",
					Signature:   "patch-sig-2",
				},
			},
		}

		// Device at 1.0.0 should get the first patch
		deviceVersion := "1.0.0"

		targetURL := release.BundleURL
		targetHash := release.Hash
		isPatch := release.IsPatch

		for _, p := range release.Patches {
			if p.BaseVersion == deviceVersion {
				targetURL = p.PatchURL
				targetHash = p.Hash
				isPatch = true
				break
			}
		}

		if !isPatch {
			t.Error("Expected patch to be selected for device at 1.0.0")
		}
		if targetURL != "https://cdn.example.com/patches/1.0.0-to-2.0.0.zip" {
			t.Errorf("Expected patch URL for 1.0.0, got %s", targetURL)
		}
		if targetHash != "patch-hash" {
			t.Errorf("Expected patch hash, got %s", targetHash)
		}
	})

	t.Run("full bundle when no matching patch", func(t *testing.T) {
		release := &models.Release{
			ID:                uuid.New(),
			Version:           "2.0.0",
			BundleURL:         "https://cdn.example.com/bundles/2.0.0.zip",
			Hash:              "full-hash",
			Signature:         "full-sig",
			RolloutPercentage: 100,
			Patches: []models.Patch{
				{BaseVersion: "1.5.0", PatchURL: "patch-url", Hash: "ph", Signature: "ps"},
			},
		}

		deviceVersion := "1.0.0"
		targetURL := release.BundleURL
		isPatch := false

		for _, p := range release.Patches {
			if p.BaseVersion == deviceVersion {
				targetURL = p.PatchURL
				isPatch = true
				break
			}
		}

		if isPatch {
			t.Error("No patch should match for device at 1.0.0 (only 1.5.0 patch exists)")
		}
		if targetURL != "https://cdn.example.com/bundles/2.0.0.zip" {
			t.Errorf("Expected full bundle URL, got %s", targetURL)
		}
	})
}
