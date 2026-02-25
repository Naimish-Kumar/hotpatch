package repository

import (
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"gorm.io/gorm"
)

// ReleaseRepository handles database operations for releases.
type ReleaseRepository struct {
	db *gorm.DB
}

// NewReleaseRepository creates a new ReleaseRepository.
func NewReleaseRepository(db *gorm.DB) *ReleaseRepository {
	return &ReleaseRepository{db: db}
}

// Create inserts a new release into the database.
func (r *ReleaseRepository) Create(release *models.Release) error {
	return r.db.Create(release).Error
}

// GetByID retrieves a release by its UUID.
func (r *ReleaseRepository) GetByID(id uuid.UUID) (*models.Release, error) {
	var release models.Release
	err := r.db.First(&release, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &release, nil
}

// GetActiveRelease finds the latest active release for a given app, channel combination.
func (r *ReleaseRepository) GetActiveRelease(appID uuid.UUID, channel string) (*models.Release, error) {
	var release models.Release
	err := r.db.
		Preload("Patches").
		Where("app_id = ? AND channel = ? AND is_active = true", appID, channel).
		Order("created_at DESC").
		First(&release).Error
	if err != nil {
		return nil, err
	}
	return &release, nil
}

// GetLatestActive finds the most recently created release for a channel, regardless of whether it's currently active.
func (r *ReleaseRepository) GetLatestActive(appID uuid.UUID, channel string) (*models.Release, error) {
	var release models.Release
	err := r.db.
		Where("app_id = ? AND channel = ?", appID, channel).
		Order("created_at DESC").
		First(&release).Error
	if err != nil {
		return nil, err
	}
	return &release, nil
}

// List retrieves releases with pagination and optional filters.
func (r *ReleaseRepository) List(appID uuid.UUID, channel string, isActive *bool, page, perPage int) ([]models.Release, int64, error) {
	var releases []models.Release
	var total int64

	query := r.db.Model(&models.Release{}).Where("app_id = ?", appID)

	if channel != "" {
		query = query.Where("channel = ?", channel)
	}
	if isActive != nil {
		query = query.Where("is_active = ?", *isActive)
	}

	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&releases).Error

	return releases, total, err
}

// DeactivatePreviousReleases marks all previous active releases for the same app+channel as inactive.
func (r *ReleaseRepository) DeactivatePreviousReleases(appID uuid.UUID, channel string, excludeID uuid.UUID) error {
	return r.db.
		Model(&models.Release{}).
		Where("app_id = ? AND channel = ? AND is_active = true AND id != ?", appID, channel, excludeID).
		Update("is_active", false).Error
}

// UpdateRollout updates the rollout percentage for a release.
func (r *ReleaseRepository) UpdateRollout(id uuid.UUID, percentage int) error {
	return r.db.
		Model(&models.Release{}).
		Where("id = ?", id).
		Update("rollout_percentage", percentage).Error
}

// Activate reactivates a specific release (for rollback).
func (r *ReleaseRepository) Activate(id uuid.UUID) error {
	return r.db.
		Model(&models.Release{}).
		Where("id = ?", id).
		Update("is_active", true).Error
}

// SoftDelete marks a release as inactive (archive).
func (r *ReleaseRepository) SoftDelete(id uuid.UUID) error {
	return r.db.
		Model(&models.Release{}).
		Where("id = ?", id).
		Update("is_active", false).Error
}

// ExistsByVersion checks if a release with the given version already exists for an app+channel.
func (r *ReleaseRepository) ExistsByVersion(appID uuid.UUID, version, channel string) (bool, error) {
	var count int64
	err := r.db.
		Model(&models.Release{}).
		Where("app_id = ? AND version = ? AND channel = ?", appID, version, channel).
		Count(&count).Error
	return count > 0, err
}

// CreatePatch inserts a new patch record.
func (r *ReleaseRepository) CreatePatch(patch *models.Patch) error {
	return r.db.Create(patch).Error
}
