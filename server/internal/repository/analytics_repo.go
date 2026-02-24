package repository

import (
	"time"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"gorm.io/gorm"
)

// AnalyticsRepository handles complex aggregation queries for the dashboard.
type AnalyticsRepository struct {
	db *gorm.DB
}

// NewAnalyticsRepository creates a new AnalyticsRepository.
func NewAnalyticsRepository(db *gorm.DB) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

// GetVersionDistribution returns counts of devices per version for an app.
func (r *AnalyticsRepository) GetVersionDistribution(appID uuid.UUID) ([]models.VersionDistribution, error) {
	var dist []models.VersionDistribution
	
	// Get total count first for percentage calculation
	var total int64
	r.db.Model(&models.Device{}).Where("app_id = ?", appID).Count(&total)

	err := r.db.Model(&models.Device{}).
		Select("current_version as version, COUNT(*) as count").
		Where("app_id = ?", appID).
		Group("current_version").
		Order("count DESC").
		Find(&dist).Error

	if err == nil && total > 0 {
		for i := range dist {
			dist[i].Percent = (float64(dist[i].Count) / float64(total)) * 100
		}
	}

	return dist, err
}

// GetDailyActiveDevices returns the number of unique devices seen per day for the last N days.
func (r *AnalyticsRepository) GetDailyActiveDevices(appID uuid.UUID, days int) ([]models.DailyMetric, error) {
	var metrics []models.DailyMetric
	
	// Query to count unique devices seen each day
	err := r.db.Table("devices").
		Select("DATE(last_seen) as date, COUNT(*) as value").
		Where("app_id = ? AND last_seen > ?", appID, time.Now().AddDate(0, 0, -days)).
		Group("DATE(last_seen)").
		Order("date ASC").
		Find(&metrics).Error

	return metrics, err
}

// GetDailyInstallations returns the number of successful installations per day.
func (r *AnalyticsRepository) GetDailyInstallations(appID uuid.UUID, days int) ([]models.DailyMetric, error) {
	var metrics []models.DailyMetric

	err := r.db.Table("installations").
		Select("DATE(installed_at) as date, COUNT(*) as value").
		Joins("JOIN releases ON installations.release_id = releases.id").
		Where("releases.app_id = ? AND installations.status = 'installed' AND installed_at > ?", appID, time.Now().AddDate(0, 0, -days)).
		Group("DATE(installed_at)").
		Order("date ASC").
		Find(&metrics).Error

	return metrics, err
}

// GetAggregateSuccessRate calculates the overall installation success rate for an app.
func (r *AnalyticsRepository) GetAggregateSuccessRate(appID uuid.UUID) (float64, error) {
	var stats struct {
		Total   int64
		Success int64
	}

	err := r.db.Table("installations").
		Select("COUNT(*) as total, SUM(CASE WHEN status = 'installed' THEN 1 ELSE 0 END) as success").
		Joins("JOIN releases ON installations.release_id = releases.id").
		Where("releases.app_id = ?", appID).
		Scan(&stats).Error

	if err != nil || stats.Total == 0 {
		return 0, err
	}

	return (float64(stats.Success) / float64(stats.Total)) * 100, nil
}

// GetBandwidthSaved calculates the total bytes saved by using patches instead of full bundles.
func (r *AnalyticsRepository) GetBandwidthSaved(appID uuid.UUID) (int64, error) {
	var saved int64
	err := r.db.Table("installations").
		Select("SUM(releases.size - installations.download_size)").
		Joins("JOIN releases ON installations.release_id = releases.id").
		Where("releases.app_id = ? AND installations.is_patch = true AND installations.status = 'applied'", appID).
		Scan(&saved).Error

	return saved, err
}
