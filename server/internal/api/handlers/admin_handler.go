package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

// UpdateApp allows superadmin to update any app's details/tier or regenerate API keys.
// PATCH /admin/apps/:id
func (h *AdminHandler) UpdateApp(c *gin.Context) {
	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid app ID"})
		return
	}

	var req struct {
		Name          *string `json:"name"`
		Tier          *string `json:"tier"`
		RegenerateKey bool    `json:"regenerate_key"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var app models.App
	if err := h.db.First(&app, "id = ?", appID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "App not found"})
		return
	}

	if req.Name != nil {
		app.Name = *req.Name
	}
	if req.Tier != nil {
		app.Tier = *req.Tier
	}
	if req.RegenerateKey {
		app.APIKey = "hp_" + uuid.New().String()
	}

	if err := h.db.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update app"})
		return
	}

	c.JSON(http.StatusOK, models.AppResponse{
		ID:        app.ID,
		Name:      app.Name,
		Platform:  app.Platform,
		Tier:      app.Tier,
		APIKey:    app.APIKey, // Return new key if regenerated
		CreatedAt: app.CreatedAt,
	})
}

// DeleteApp allows superadmin to delete any application.
// DELETE /admin/apps/:id
func (h *AdminHandler) DeleteApp(c *gin.Context) {
	appID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid app ID"})
		return
	}

	if err := h.db.Delete(&models.App{}, "id = ?", appID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete app"})
		return
	}

	c.Status(http.StatusNoContent)
}

// ListSettings returns all global system settings.
// GET /admin/settings
func (h *AdminHandler) ListSettings(c *gin.Context) {
	var settings []models.SystemSetting
	if err := h.db.Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// UpdateSetting allows superadmin to update global credentials and configs.
// PUT /admin/settings/:key
func (h *AdminHandler) UpdateSetting(c *gin.Context) {
	key := c.Param("key")
	var req models.UpdateSystemSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	setting := models.SystemSetting{
		Key:   key,
		Value: req.Value,
	}

	if err := h.db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update setting"})
		return
	}

	c.JSON(http.StatusOK, setting)
}

// ListAllUsers returns all users in the system.
// GET /admin/users
func (h *AdminHandler) ListAllUsers(c *gin.Context) {
	var users []models.User
	if err := h.db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var response []models.UserResponse
	for _, user := range users {
		response = append(response, models.UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
			AvatarURL:   user.AvatarURL,
			IsVerified:  user.IsVerified,
		})
	}

	c.JSON(http.StatusOK, response)
}

// DeleteUser allows superadmin to delete any user.
// DELETE /admin/users/:id
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	if err := h.db.Delete(&models.User{}, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.Status(http.StatusNoContent)
}
