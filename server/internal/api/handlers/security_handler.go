package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
)

// SecurityHandler handles security-related API requests.
type SecurityHandler struct {
	service *services.SecurityService
}

// NewSecurityHandler creates a new SecurityHandler.
func NewSecurityHandler(service *services.SecurityService) *SecurityHandler {
	return &SecurityHandler{service: service}
}

// ── API Keys ──────────────────────────────────────────

func (h *SecurityHandler) CreateApiKey(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	var req models.CreateApiKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey, rawKey, err := h.service.CreateApiKey(c.Request.Context(), appID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"api_key": apiKey,
		"raw_key": rawKey, // Only returned once
	})
}

func (h *SecurityHandler) ListApiKeys(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	keys, err := h.service.ListApiKeys(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, keys)
}

func (h *SecurityHandler) DeleteApiKey(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))
	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid key ID"})
		return
	}

	if err := h.service.DeleteApiKey(appID, keyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key deleted"})
}

// ── Signing Keys ──────────────────────────────────────

func (h *SecurityHandler) CreateSigningKey(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	var req models.CreateSigningKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	key, err := h.service.CreateSigningKey(appID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, key)
}

func (h *SecurityHandler) ListSigningKeys(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	keys, err := h.service.ListSigningKeys(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, keys)
}

func (h *SecurityHandler) DeleteSigningKey(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))
	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid key ID"})
		return
	}

	if err := h.service.DeleteSigningKey(appID, keyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Signing key deleted"})
}

// ── Audit Logs ────────────────────────────────────────

func (h *SecurityHandler) ListAuditLogs(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	logs, err := h.service.ListAuditLogs(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}
