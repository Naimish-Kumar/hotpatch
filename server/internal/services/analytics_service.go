package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
)

// AnalyticsService orchestrates aggregate statistics.
type AnalyticsService struct {
	repo        *repository.AnalyticsRepository
	deviceRepo  *repository.DeviceRepository
	releaseRepo *repository.ReleaseRepository
}

// NewAnalyticsService creates a new AnalyticsService.
func NewAnalyticsService(
	repo *repository.AnalyticsRepository,
	deviceRepo *repository.DeviceRepository,
	releaseRepo *repository.ReleaseRepository,
) *AnalyticsService {
	return &AnalyticsService{
		repo:        repo,
		deviceRepo:  deviceRepo,
		releaseRepo: releaseRepo,
	}
}

// GetDashboardOverview compiles core metrics for the dashboard home.
func (s *AnalyticsService) GetDashboardOverview(ctx context.Context, appID uuid.UUID) (*models.DashboardOverview, error) {
	totalDevices, err := s.deviceRepo.CountByApp(appID)
	if err != nil {
		return nil, err
	}

	successRate, _ := s.repo.GetAggregateSuccessRate(appID)
	_, totalReleases, _ := s.releaseRepo.List(appID, "", nil, 1, 1)

	// Count devices active in the last 24 hours (real query)
	activeLast24h, _ := s.deviceRepo.CountActiveLast24h(appID)

	// Count total successful installations (real query)
	updatesDelivered, _ := s.repo.CountSuccessfulInstallations(appID)

	// Calculate devices trend: compare this week's new devices vs last week's
	devicesTrend, _ := s.repo.GetDevicesGrowthRate(appID)

	// Bandwidth tracking
	bandwidthSaved, _ := s.repo.GetBandwidthSaved(appID)

	return &models.DashboardOverview{
		TotalDevices:     totalDevices,
		ActiveLast24h:    activeLast24h,
		TotalReleases:    totalReleases,
		UpdatesDelivered: updatesDelivered,
		SuccessRate:      successRate,
		DevicesTrend:     devicesTrend,
		BandwidthSaved:   bandwidthSaved,
	}, nil
}

// GetVersionDistribution retrieves the version breakdown.
func (s *AnalyticsService) GetVersionDistribution(ctx context.Context, appID uuid.UUID) ([]models.VersionDistribution, error) {
	return s.repo.GetVersionDistribution(appID)
}

// GetSystemTrends retrieves 30-day trends for DAU and Installations.
func (s *AnalyticsService) GetSystemTrends(ctx context.Context, appID uuid.UUID) (map[string][]models.DailyMetric, error) {
	dau, _ := s.repo.GetDailyActiveDevices(appID, 30)
	installs, _ := s.repo.GetDailyInstallations(appID, 30)

	return map[string][]models.DailyMetric{
		"daily_active_devices": dau,
		"installations":        installs,
	}, nil
}

// GetReleaseDetails returns analytics for a specific release.
func (s *AnalyticsService) GetReleaseDetails(ctx context.Context, releaseID uuid.UUID) (*models.ReleaseAnalytics, error) {
	release, err := s.releaseRepo.GetByID(releaseID)
	if err != nil {
		return nil, err
	}

	statusCounts, _ := s.deviceRepo.CountInstallationsByStatus(releaseID)

	// Calculate adoption % relative to total devices for that app
	totalDevices, _ := s.deviceRepo.CountByApp(release.AppID)
	installedCount := statusCounts["installed"]

	adoption := 0.0
	if totalDevices > 0 {
		adoption = (float64(installedCount) / float64(totalDevices)) * 100
	}

	// Get real installation timeline for this release
	installTimeline, _ := s.repo.GetReleaseInstallTimeline(releaseID, 30)

	return &models.ReleaseAnalytics{
		ReleaseID:       releaseID.String(),
		Version:         release.Version,
		StatusCounts:    statusCounts,
		AdoptionPercent: adoption,
		InstallTimeline: installTimeline,
	}, nil
}
