package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
)

// DeviceHandler handles device registration and installation reporting.
type DeviceHandler struct {
	service *services.DeviceService
}

// NewDeviceHandler creates a new DeviceHandler.
func NewDeviceHandler(service *services.DeviceService) *DeviceHandler {
	return &DeviceHandler{service: service}
}

// RegisterDevice handles POST /devices.
// Called by the SDK to register a device or update its last_seen.
func (h *DeviceHandler) RegisterDevice(c *gin.Context) {
	var req models.RegisterDeviceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	device, err := h.service.RegisterOrUpdate(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, device)
}

// ReportInstallation handles POST /installations.
// Called by the SDK to report install result (applied/failed/rolled_back).
func (h *DeviceHandler) ReportInstallation(c *gin.Context) {
	var req models.ReportInstallationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	installation, err := h.service.ReportInstallation(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, installation)
}

// ListDevices handles GET /devices?app_id=...&page=...&per_page=...
func (h *DeviceHandler) ListDevices(c *gin.Context) {
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

	page := 1
	perPage := 20

	devices, total, err := h.service.ListDevices(appID, page, perPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"devices":  devices,
		"total":    total,
		"page":     page,
		"per_page": perPage,
	})
}

// GetInstallationStats handles GET /releases/:id/stats
func (h *DeviceHandler) GetInstallationStats(c *gin.Context) {
	releaseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release ID"})
		return
	}

	stats, err := h.service.GetInstallationStats(releaseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"release_id": releaseID,
		"stats":      stats,
	})
}
