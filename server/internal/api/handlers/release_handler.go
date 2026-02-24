package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
)

// ReleaseHandler handles release management endpoints.
type ReleaseHandler struct {
	service *services.ReleaseService
}

// NewReleaseHandler creates a new ReleaseHandler.
func NewReleaseHandler(service *services.ReleaseService) *ReleaseHandler {
	return &ReleaseHandler{service: service}
}

// Create handles uploading a new release bundle.
// POST /releases (multipart/form-data: "bundle" file + "metadata" JSON field)
func (h *ReleaseHandler) Create(c *gin.Context) {
	// Get app_id from JWT context
	appIDStr, exists := c.Get("app_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "App ID not found in token"})
		return
	}
	appID, err := uuid.Parse(appIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid app ID in token"})
		return
	}

	// Parse metadata JSON from form field
	metadataStr := c.PostForm("metadata")
	if metadataStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "metadata field is required"})
		return
	}

	var req models.CreateReleaseRequest
	if err := json.Unmarshal([]byte(metadataStr), &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid metadata JSON: " + err.Error()})
		return
	}

	// Get the bundle file
	file, _, err := c.Request.FormFile("bundle")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bundle file is required"})
		return
	}
	defer file.Close()

	// Create the release
	release, err := h.service.Create(c.Request.Context(), &req, appID, file)
	if err != nil {
		// Check for version conflict (409)
		if err.Error() == "version "+req.Version+" already exists for channel "+req.Channel {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, release)
}

// List retrieves releases with optional filters.
// GET /releases?app_id=...&channel=...&is_active=...&page=...&per_page=...
func (h *ReleaseHandler) List(c *gin.Context) {
	// Get app_id from JWT context
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

	var query models.ReleaseListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse is_active filter
	var isActive *bool
	if query.IsActive != "" {
		val := query.IsActive == "true"
		isActive = &val
	}

	releases, total, err := h.service.List(appID, query.Channel, isActive, query.Page, query.PerPage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"releases": releases,
		"total":    total,
		"page":     query.Page,
		"per_page": query.PerPage,
	})
}

// GetByID retrieves a single release detail.
// GET /releases/:id
func (h *ReleaseHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release ID"})
		return
	}

	release, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Release not found"})
		return
	}

	c.JSON(http.StatusOK, release)
}

// Rollback designates a previous version as the active release.
// PATCH /releases/:id/rollback
func (h *ReleaseHandler) Rollback(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release ID"})
		return
	}

	release, err := h.service.Rollback(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Rollback successful",
		"release": release,
	})
}

// UpdateRollout adjusts the rollout percentage for a release.
// PATCH /releases/:id/rollout
func (h *ReleaseHandler) UpdateRollout(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release ID"})
		return
	}

	var req models.UpdateRolloutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateRollout(c.Request.Context(), id, req.RolloutPercentage); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":            "Rollout updated",
		"rollout_percentage": req.RolloutPercentage,
	})
}

// Archive soft-deletes a release.
// DELETE /releases/:id
func (h *ReleaseHandler) Archive(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release ID"})
		return
	}

	if err := h.service.Archive(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Release archived"})
}
// AddPatch handles uploading a patch for an existing release.
// POST /releases/:id/patches
func (h *ReleaseHandler) AddPatch(c *gin.Context) {
	releaseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid release ID"})
		return
	}

	metadataStr := c.PostForm("metadata")
	var req models.AddPatchRequest
	if err := json.Unmarshal([]byte(metadataStr), &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid metadata: " + err.Error()})
		return
	}

	file, _, err := c.Request.FormFile("patch")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "patch file is required"})
		return
	}
	defer file.Close()

	patch, err := h.service.AddPatch(c.Request.Context(), releaseID, &req, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, patch)
}
