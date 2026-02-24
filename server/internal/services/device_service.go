package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
)

// DeviceService handles device registration and installation tracking.
type DeviceService struct {
	repo *repository.DeviceRepository
}

// NewDeviceService creates a new DeviceService.
func NewDeviceService(repo *repository.DeviceRepository) *DeviceService {
	return &DeviceService{repo: repo}
}

// RegisterOrUpdate registers a new device or updates an existing one's last_seen timestamp.
func (s *DeviceService) RegisterOrUpdate(req *models.RegisterDeviceRequest) (*models.Device, error) {
	appID, err := uuid.Parse(req.AppID)
	if err != nil {
		return nil, fmt.Errorf("invalid app_id: %w", err)
	}

	device := &models.Device{
		ID:             uuid.New(),
		DeviceID:       req.DeviceID,
		AppID:          appID,
		Platform:       req.Platform,
		CurrentVersion: req.CurrentVersion,
		LastSeen:       time.Now(),
	}

	if err := s.repo.Upsert(device); err != nil {
		return nil, fmt.Errorf("failed to register device: %w", err)
	}

	return device, nil
}

// ReportInstallation records an installation event from the SDK.
func (s *DeviceService) ReportInstallation(req *models.ReportInstallationRequest) (*models.Installation, error) {
	// Find the device by its SDK-generated device_id
	device, err := s.repo.GetByDeviceID(req.DeviceID)
	if err != nil {
		return nil, fmt.Errorf("device not found: %w", err)
	}

	releaseID, err := uuid.Parse(req.ReleaseID)
	if err != nil {
		return nil, fmt.Errorf("invalid release_id: %w", err)
	}

	installation := &models.Installation{
		ID:           uuid.New(),
		DeviceID:     device.ID,
		ReleaseID:    releaseID,
		Status:       req.Status,
		IsPatch:      req.IsPatch,
		DownloadSize: req.DownloadSize,
		InstalledAt:  time.Now(),
	}

	if err := s.repo.CreateInstallation(installation); err != nil {
		return nil, fmt.Errorf("failed to record installation: %w", err)
	}

	return installation, nil
}

// ListDevices retrieves devices for an app with pagination.
func (s *DeviceService) ListDevices(appID uuid.UUID, page, perPage int) ([]models.Device, int64, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return s.repo.ListByApp(appID, page, perPage)
}

// GetDeviceCount returns the total device count for an app.
func (s *DeviceService) GetDeviceCount(appID uuid.UUID) (int64, error) {
	return s.repo.CountByApp(appID)
}

// GetInstallationStats returns installation counts grouped by status for a release.
func (s *DeviceService) GetInstallationStats(releaseID uuid.UUID) (map[string]int64, error) {
	return s.repo.CountInstallationsByStatus(releaseID)
}
