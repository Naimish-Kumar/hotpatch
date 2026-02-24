package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/services"
)

// AnalyticsHandler handles analytics-related API requests.
type AnalyticsHandler struct {
	service *services.AnalyticsService
}

// NewAnalyticsHandler creates a new AnalyticsHandler.
func NewAnalyticsHandler(service *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{service: service}
}

// GetOverview handles GET /analytics/overview.
func (h *AnalyticsHandler) GetOverview(c *gin.Context) {
	appIDStr, exists := c.Get("app_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID not found in token"})
		return
	}
	appID, err := uuid.Parse(appIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid app ID"})
		return
	}

	overview, err := h.service.GetDashboardOverview(c.Request.Context(), appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, overview)
}

// GetDistribution handles GET /analytics/distribution.
func (h *AnalyticsHandler) GetDistribution(c *gin.Context) {
	appIDStr, exists := c.Get("app_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID not found in token"})
		return
	}
	appID, err := uuid.Parse(appIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid app ID"})
		return
	}

	dist, err := h.service.GetVersionDistribution(c.Request.Context(), appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dist)
}

// GetTrends handles GET /analytics/trends.
func (h *AnalyticsHandler) GetTrends(c *gin.Context) {
	appIDStr, exists := c.Get("app_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID not found in token"})
		return
	}
	appID, err := uuid.Parse(appIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid app ID"})
		return
	}

	trends, err := h.service.GetSystemTrends(c.Request.Context(), appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trends)
}

// GetReleaseAnalytics handles GET /analytics/releases/:id.
func (h *AnalyticsHandler) GetReleaseAnalytics(c *gin.Context) {
	releaseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release ID"})
		return
	}

	stats, err := h.service.GetReleaseDetails(c.Request.Context(), releaseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
