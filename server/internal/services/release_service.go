package services

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
	"github.com/hotpatch/server/internal/storage"
	"github.com/redis/go-redis/v9"
)

// ReleaseService handles release management business logic.
type ReleaseService struct {
	repo            *repository.ReleaseRepository
	storage         *storage.S3Storage
	settingsService *SettingsService
	redis           *redis.Client
}

// NewReleaseService creates a new ReleaseService.
func NewReleaseService(repo *repository.ReleaseRepository, storage *storage.S3Storage, settingsService *SettingsService, redis *redis.Client) *ReleaseService {
	return &ReleaseService{repo: repo, storage: storage, settingsService: settingsService, redis: redis}
}

func (s *ReleaseService) invalidateCache(ctx context.Context, appID uuid.UUID, channel string) {
	if s.redis != nil {
		cacheKey := fmt.Sprintf("release:active:%s:%s", appID, channel)
		s.redis.Del(ctx, cacheKey)
	}
}

// Create validates and stores a new release, uploads the bundle to S3, and deactivates previous releases.
func (s *ReleaseService) Create(ctx context.Context, req *models.CreateReleaseRequest, appID uuid.UUID, bundleFile io.Reader) (*models.Release, error) {
	// Default channel
	channel := req.Channel
	if channel == "" {
		channel = "production"
	}

	// Default rollout
	rollout := req.RolloutPercentage
	if rollout == 0 {
		rollout = 100
	}

	// Check for duplicate version
	exists, err := s.repo.ExistsByVersion(appID, req.Version, channel)
	if err != nil {
		return nil, fmt.Errorf("failed to check version: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("version %s already exists for channel %s", req.Version, channel)
	}

	// Upload bundle to S3
	objectKey := fmt.Sprintf("bundles/%s/%s/%s/%s.zip", appID, req.Platform, channel, req.Version)
	_, err = s.storage.Upload(ctx, objectKey, bundleFile, "application/zip")
	if err != nil {
		return nil, fmt.Errorf("failed to upload bundle: %w", err)
	}

	// Generate the CDN/presigned URL
	bundleURL, err := s.storage.GetPresignedURL(ctx, objectKey)
	if err != nil {
		return nil, fmt.Errorf("failed to generate bundle URL: %w", err)
	}

	// Create release record
	release := &models.Release{
		ID:                uuid.New(),
		AppID:             appID,
		Version:           req.Version,
		Channel:           channel,
		BundleURL:         bundleURL,
		Hash:              req.Hash,
		Signature:         req.Signature,
		IsEncrypted:       req.IsEncrypted,
		IsPatch:           req.IsPatch,
		BaseVersion:       req.BaseVersion,
		KeyID:             &req.KeyID,
		Size:              req.Size,
		Mandatory:         req.Mandatory,
		RolloutPercentage: rollout,
		IsActive:          true,
		CreatedAt:         time.Now(),
	}

	if err := s.repo.Create(release); err != nil {
		return nil, fmt.Errorf("failed to create release: %w", err)
	}

	// Deactivate previous releases for the same channel
	if err := s.repo.DeactivatePreviousReleases(appID, channel, release.ID); err != nil {
		return nil, fmt.Errorf("failed to deactivate previous releases: %w", err)
	}

	// Dispatch webhook
	s.settingsService.DispatchEvent(appID, "release.created", release)

	// Invalidate cache
	s.invalidateCache(ctx, appID, channel)

	return release, nil
}

// GetByID retrieves a release by ID.
func (s *ReleaseService) GetByID(id uuid.UUID) (*models.Release, error) {
	return s.repo.GetByID(id)
}

// List retrieves releases with filters and pagination.
func (s *ReleaseService) List(appID uuid.UUID, channel string, isActive *bool, page, perPage int) ([]models.Release, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return s.repo.List(appID, channel, isActive, page, perPage)
}

// Rollback designates a previous version as the active release for a channel.
func (s *ReleaseService) Rollback(releaseID uuid.UUID) (*models.Release, error) {
	release, err := s.repo.GetByID(releaseID)
	if err != nil {
		return nil, fmt.Errorf("release not found: %w", err)
	}

	// Deactivate all releases in this channel
	if err := s.repo.DeactivatePreviousReleases(release.AppID, release.Channel, releaseID); err != nil {
		return nil, fmt.Errorf("failed to deactivate releases: %w", err)
	}

	// Reactivate the target release
	if err := s.repo.Activate(releaseID); err != nil {
		return nil, fmt.Errorf("failed to activate release: %w", err)
	}

	release.IsActive = true

	// Dispatch webhook
	s.settingsService.DispatchEvent(release.AppID, "release.rolled_back", release)

	// Invalidate cache
	s.invalidateCache(context.Background(), release.AppID, release.Channel)

	return release, nil
}

// UpdateRollout changes the rollout percentage for a release.
func (s *ReleaseService) UpdateRollout(ctx context.Context, releaseID uuid.UUID, percentage int) error {
	release, err := s.repo.GetByID(releaseID)
	if err == nil {
		s.invalidateCache(ctx, release.AppID, release.Channel)
	}
	return s.repo.UpdateRollout(releaseID, percentage)
}

// Archive soft-deletes a release.
func (s *ReleaseService) Archive(ctx context.Context, releaseID uuid.UUID) error {
	release, err := s.repo.GetByID(releaseID)
	if err == nil {
		s.invalidateCache(ctx, release.AppID, release.Channel)
	}
	return s.repo.SoftDelete(releaseID)
}
// AddPatch uploads a patch file and associates it with a release.
func (s *ReleaseService) AddPatch(ctx context.Context, releaseID uuid.UUID, req *models.AddPatchRequest, patchFile io.Reader) (*models.Patch, error) {
	release, err := s.repo.GetByID(releaseID)
	if err != nil {
		return nil, fmt.Errorf("release not found: %w", err)
	}

	// Upload patch to S3
	objectKey := fmt.Sprintf("patches/%s/%s/from-%s.patch", release.AppID, release.ID, req.BaseVersion)
	_, err = s.storage.Upload(ctx, objectKey, patchFile, "application/octet-stream")
	if err != nil {
		return nil, fmt.Errorf("failed to upload patch: %w", err)
	}

	// Generate CDN URL
	patchURL, err := s.storage.GetPresignedURL(ctx, objectKey)
	if err != nil {
		return nil, fmt.Errorf("failed to generate patch URL: %w", err)
	}

	// Create patch record
	patch := &models.Patch{
		ID:          uuid.New(),
		ReleaseID:   releaseID,
		BaseVersion: req.BaseVersion,
		PatchURL:    patchURL,
		Hash:        req.Hash,
		Signature:   req.Signature,
		Size:        req.Size,
		CreatedAt:   time.Now(),
	}

	if err := s.repo.CreatePatch(patch); err != nil {
		return nil, fmt.Errorf("failed to save patch record: %w", err)
	}

	// Invalidate cache since active release now has a new patch
	s.invalidateCache(ctx, release.AppID, release.Channel)

	return patch, nil
}
