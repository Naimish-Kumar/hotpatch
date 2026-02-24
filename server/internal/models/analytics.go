package models

import "time"

// DashboardOverview contains aggregate stats for the primary dashboard view.
type DashboardOverview struct {
	TotalDevices     int64   `json:"total_devices"`
	ActiveLast24h    int64   `json:"active_last_24h"`
	TotalReleases    int64   `json:"total_releases"`
	UpdatesDelivered int64   `json:"updates_delivered"`
	SuccessRate      float64 `json:"success_rate"` // % of successful installations
	DevicesTrend     float64 `json:"devices_trend"` // % change vs previous period
	BandwidthSaved   int64   `json:"bandwidth_saved"` // in bytes
}

// VersionDistribution represents how many devices are on each version.
type VersionDistribution struct {
	Version string `json:"version"`
	Count   int64  `json:"count"`
	Percent float64 `json:"percent"`
}

// DailyMetric represents a metric value for a specific day.
type DailyMetric struct {
	Date  time.Time `json:"date"`
	Value int64     `json:"value"`
}

// ReleaseAnalytics provides detailed stats for a specific release.
type ReleaseAnalytics struct {
	ReleaseID       string            `json:"release_id"`
	Version         string            `json:"version"`
	StatusCounts    map[string]int64  `json:"status_counts"` // downloaded, installed, failed, rolled_back
	AdoptionPercent float64           `json:"adoption_percent"`
	InstallTimeline []DailyMetric     `json:"install_timeline"`
}
