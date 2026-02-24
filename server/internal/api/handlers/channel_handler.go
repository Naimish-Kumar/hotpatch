package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
)

// ChannelHandler handles channel management endpoints.
type ChannelHandler struct {
	service *services.ChannelService
}

// NewChannelHandler creates a new ChannelHandler.
func NewChannelHandler(service *services.ChannelService) *ChannelHandler {
	return &ChannelHandler{service: service}
}

// Create handles POST /channels.
func (h *ChannelHandler) Create(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	var req models.CreateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	channel, err := h.service.Create(c.Request.Context(), appID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, channel)
}

// List handles GET /channels.
func (h *ChannelHandler) List(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	channels, err := h.service.ListByApp(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, channels)
}

// Get handles GET /channels/:slug.
func (h *ChannelHandler) Get(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))
	slug := c.Param("slug")

	channel, err := h.service.GetBySlug(appID, slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Channel not found"})
		return
	}

	c.JSON(http.StatusOK, channel)
}

// Update handles PATCH /channels/:slug.
func (h *ChannelHandler) Update(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))
	slug := c.Param("slug")

	var req models.UpdateChannelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	channel, err := h.service.Update(appID, slug, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, channel)
}

// Delete handles DELETE /channels/:slug.
func (h *ChannelHandler) Delete(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))
	slug := c.Param("slug")

	if err := h.service.Delete(appID, slug); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Channel deleted"})
}
