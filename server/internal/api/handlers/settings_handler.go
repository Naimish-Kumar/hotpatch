package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
)

// SettingsHandler handles app configuration and webhooks.
type SettingsHandler struct {
	service *services.SettingsService
}

// NewSettingsHandler creates a new SettingsHandler.
func NewSettingsHandler(service *services.SettingsService) *SettingsHandler {
	return &SettingsHandler{service: service}
}

// UpdateApp handles PATCH /settings/app.
func (h *SettingsHandler) UpdateApp(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	var req models.UpdateAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	app, err := h.service.UpdateApp(c.Request.Context(), appID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, app)
}

// CreateWebhook handles POST /settings/webhooks.
func (h *SettingsHandler) CreateWebhook(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	var req models.CreateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	webhook, secret, err := h.service.CreateWebhook(c.Request.Context(), appID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"webhook": webhook,
		"secret":  secret, // Only returned once
	})
}

// ListWebhooks handles GET /settings/webhooks.
func (h *SettingsHandler) ListWebhooks(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	webhooks, err := h.service.ListWebhooks(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, webhooks)
}

// DeleteWebhook handles DELETE /settings/webhooks/:id.
func (h *SettingsHandler) DeleteWebhook(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))
	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook ID"})
		return
	}

	if err := h.service.DeleteWebhook(appID, webhookID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Webhook deleted"})
}
