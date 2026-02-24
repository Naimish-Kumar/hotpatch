package services

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
	"github.com/redis/go-redis/v9"
)

// UpdateService handles the high-performance update check logic.
type UpdateService struct {
	releaseRepo *repository.ReleaseRepository
	deviceRepo  *repository.DeviceRepository
	redis       *redis.Client
}

// NewUpdateService creates a new UpdateService.
func NewUpdateService(releaseRepo *repository.ReleaseRepository, deviceRepo *repository.DeviceRepository, redis *redis.Client) *UpdateService {
	return &UpdateService{
		releaseRepo: releaseRepo,
		deviceRepo:  deviceRepo,
		redis:       redis,
	}
}

// CheckForUpdate determines if an update is available for a device.
// This is the most critical function in the system — it must be fast.
func (s *UpdateService) CheckForUpdate(ctx context.Context, req *models.UpdateCheckRequest) (*models.UpdateCheckResponse, error) {
	appID, err := uuid.Parse(req.AppID)
	if err != nil {
		return nil, fmt.Errorf("invalid app_id: %w", err)
	}

	var release *models.Release

	// Try Redis Cache first
	if s.redis != nil {
		cacheKey := fmt.Sprintf("release:active:%s:%s", appID, req.Channel)
		cached, err := s.redis.Get(ctx, cacheKey).Result()
		if err == nil {
			_ = json.Unmarshal([]byte(cached), &release)
		}
	}

	if release == nil {
		// Cache miss — hit the DB
		release, err = s.releaseRepo.GetActiveRelease(appID, req.Channel)
		if err != nil {
			// No active release found — no update available
			return &models.UpdateCheckResponse{UpdateAvailable: false}, nil
		}

		// Save to Redis (TTL 5 minutes for active releases)
		if s.redis != nil {
			cacheKey := fmt.Sprintf("release:active:%s:%s", appID, req.Channel)
			data, _ := json.Marshal(release)
			s.redis.Set(ctx, cacheKey, data, 5*time.Minute)
		}
	}

	// Check if the current version is already up to date or newer
	if !isVersionGreater(release.Version, req.Version) {
		return &models.UpdateCheckResponse{UpdateAvailable: false}, nil
	}

	// Check rollout percentage using stable cohort bucketing
	if release.RolloutPercentage < 100 {
		if !isInRollout(req.DeviceID, release.RolloutPercentage) {
			return &models.UpdateCheckResponse{UpdateAvailable: false}, nil
		}
	}

	// Determine if we can send a patch instead of a full bundle
	targetURL := release.BundleURL
	targetHash := release.Hash
	targetSignature := release.Signature
	isEncrypted := release.IsEncrypted
	isPatch := release.IsPatch
	baseVersion := release.BaseVersion

	for _, p := range release.Patches {
		if p.BaseVersion == req.Version {
			targetURL = p.PatchURL
			targetHash = p.Hash
			targetSignature = p.Signature
			isPatch = true
			isEncrypted = release.IsEncrypted
			baseVersion = p.BaseVersion
			break
		}
	}

	// Update available — return the bundle or patch info
	return &models.UpdateCheckResponse{
		ID:              release.ID.String(),
		UpdateAvailable: true,
		BundleURL:       targetURL,
		Hash:            targetHash,
		Signature:       targetSignature,
		Mandatory:       release.Mandatory,
		Version:         release.Version,
		IsEncrypted:     isEncrypted,
		IsPatch:         isPatch,
		BaseVersion:     baseVersion,
	}, nil
}

// isInRollout implements stable cohort bucketing using FNV-1a hash.
func isInRollout(deviceID string, rolloutPct int) bool {
	h := fnv.New32a()
	h.Write([]byte(deviceID))
	bucket := int(h.Sum32() % 100) // 0-99, stable per device
	return bucket < rolloutPct
}

// isVersionGreater returns true if v1 > v2 using semantic versioning.
// Handles versions like "1.2.3", "1.10.0", etc.
func isVersionGreater(v1, v2 string) bool {
	p1 := parseVersion(v1)
	p2 := parseVersion(v2)

	maxLen := len(p1)
	if len(p2) > maxLen {
		maxLen = len(p2)
	}

	for i := 0; i < maxLen; i++ {
		var a, b int
		if i < len(p1) {
			a = p1[i]
		}
		if i < len(p2) {
			b = p2[i]
		}
		if a > b {
			return true
		}
		if a < b {
			return false
		}
	}
	return false // equal
}

// parseVersion splits a version string like "1.2.3" into [1, 2, 3].
// Tolerates leading "v" prefix and non-numeric suffixes (e.g. "1.2.3-beta").
func parseVersion(v string) []int {
	// Strip optional "v" prefix
	if len(v) > 0 && (v[0] == 'v' || v[0] == 'V') {
		v = v[1:]
	}

	parts := strings.Split(v, ".")
	result := make([]int, 0, len(parts))
	for _, p := range parts {
		// Strip any pre-release suffix (e.g. "3-beta" -> "3")
		numStr := p
		for i, c := range p {
			if c < '0' || c > '9' {
				numStr = p[:i]
				break
			}
		}
		n, err := strconv.Atoi(numStr)
		if err != nil {
			n = 0
		}
		result = append(result, n)
	}
	return result
}
