package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hotpatch/server/internal/models"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// ListAllApps returns all registered applications in the system.
// GET /admin/apps
func (h *AdminHandler) ListAllApps(c *gin.Context) {
	var apps []models.App
	if err := h.db.Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch apps"})
		return
	}

	var response []models.AppResponse
	for _, app := range apps {
		response = append(response, models.AppResponse{
			ID:        app.ID,
			Name:      app.Name,
			Platform:  app.Platform,
			CreatedAt: app.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetSystemStats returns global system metrics.
// GET /admin/stats
func (h *AdminHandler) GetSystemStats(c *gin.Context) {
	var appCount int64
	var releaseCount int64
	var deviceCount int64

	h.db.Model(&models.App{}).Count(&appCount)
	h.db.Model(&models.Release{}).Count(&releaseCount)
	h.db.Model(&models.Device{}).Count(&deviceCount)

	c.JSON(http.StatusOK, gin.H{
		"total_apps":     appCount,
		"total_releases": releaseCount,
		"total_devices":  deviceCount,
		"status":         "healthy",
	})
}
