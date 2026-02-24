package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
)

// UpdateHandler handles the high-throughput update check endpoint.
type UpdateHandler struct {
	service *services.UpdateService
}

// NewUpdateHandler creates a new UpdateHandler.
func NewUpdateHandler(service *services.UpdateService) *UpdateHandler {
	return &UpdateHandler{service: service}
}

// CheckForUpdate handles GET /update/check.
// This is the single most critical endpoint — called on every app launch.
// Target P99 latency: < 50ms, Target P50: < 10ms.
func (h *UpdateHandler) CheckForUpdate(c *gin.Context) {
	var req models.UpdateCheckRequest

	// Support both query params and JSON body
	if c.Request.Method == "GET" {
		req = models.UpdateCheckRequest{
			AppID:    c.Query("appId"),
			DeviceID: c.Query("deviceId"),
			Version:  c.Query("version"),
			Platform: c.Query("platform"),
			Channel:  c.Query("channel"),
		}
	} else {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// Validate required fields
	if req.AppID == "" || req.DeviceID == "" || req.Version == "" || req.Platform == "" || req.Channel == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "appId, deviceId, version, platform, and channel are all required",
		})
		return
	}

	response, err := h.service.CheckForUpdate(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}
