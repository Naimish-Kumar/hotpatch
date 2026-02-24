package repository

import (
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// DeviceRepository handles database operations for devices and installations.
type DeviceRepository struct {
	db *gorm.DB
}

// NewDeviceRepository creates a new DeviceRepository.
func NewDeviceRepository(db *gorm.DB) *DeviceRepository {
	return &DeviceRepository{db: db}
}

// Upsert creates or updates a device record based on the SDK-generated device_id.
// Uses ON CONFLICT to update last_seen and current_version on repeated registrations.
func (r *DeviceRepository) Upsert(device *models.Device) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "device_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"current_version", "last_seen"}),
	}).Create(device).Error
}

// GetByDeviceID finds a device by its SDK-generated string ID.
func (r *DeviceRepository) GetByDeviceID(deviceID string) (*models.Device, error) {
	var device models.Device
	err := r.db.Where("device_id = ?", deviceID).First(&device).Error
	if err != nil {
		return nil, err
	}
	return &device, nil
}

// ListByApp retrieves all devices for a given app with pagination.
func (r *DeviceRepository) ListByApp(appID uuid.UUID, page, perPage int) ([]models.Device, int64, error) {
	var devices []models.Device
	var total int64

	query := r.db.Model(&models.Device{}).Where("app_id = ?", appID)
	query.Count(&total)

	offset := (page - 1) * perPage
	err := query.
		Order("last_seen DESC").
		Offset(offset).
		Limit(perPage).
		Find(&devices).Error

	return devices, total, err
}

// CountByApp returns the total number of devices for an app.
func (r *DeviceRepository) CountByApp(appID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&models.Device{}).Where("app_id = ?", appID).Count(&count).Error
	return count, err
}

// CreateInstallation records an installation event (applied/failed/rolled_back).
func (r *DeviceRepository) CreateInstallation(installation *models.Installation) error {
	return r.db.Create(installation).Error
}

// GetInstallationsByRelease returns all installations for a given release.
func (r *DeviceRepository) GetInstallationsByRelease(releaseID uuid.UUID) ([]models.Installation, error) {
	var installations []models.Installation
	err := r.db.Where("release_id = ?", releaseID).Find(&installations).Error
	return installations, err
}

// CountInstallationsByStatus returns counts grouped by status for a release.
func (r *DeviceRepository) CountInstallationsByStatus(releaseID uuid.UUID) (map[string]int64, error) {
	type Result struct {
		Status string
		Count  int64
	}
	var results []Result
	err := r.db.
		Model(&models.Installation{}).
		Select("status, COUNT(*) as count").
		Where("release_id = ?", releaseID).
		Group("status").
		Find(&results).Error
	if err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Status] = r.Count
	}
	return counts, nil
}
