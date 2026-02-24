package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/api/middleware"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
	"gorm.io/gorm"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	db                 *gorm.DB
	channelService     *services.ChannelService
	jwtSecret          string
	jwtExpiry          int // hours
	superadminEmail    string
	superadminPassword string
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(db *gorm.DB, channelService *services.ChannelService, jwtSecret string, jwtExpiry int, superadminEmail string, superadminPassword string) *AuthHandler {
	return &AuthHandler{
		db:                 db,
		channelService:     channelService,
		jwtSecret:          jwtSecret,
		jwtExpiry:          jwtExpiry,
		superadminEmail:    superadminEmail,
		superadminPassword: superadminPassword,
	}
}

// TokenRequest is the body for POST /auth/token.
type TokenRequest struct {
	APIKey string `json:"api_key" binding:"required"`
}

// TokenResponse is the response from POST /auth/token.
type TokenResponse struct {
	Token     string             `json:"token"`
	TokenType string             `json:"token_type"`
	ExpiresIn int                `json:"expires_in"` // seconds
	App       models.AppResponse `json:"app"`
}

// SuperadminLoginRequest is the body for POST /auth/super/login.
type SuperadminLoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// CreateToken exchanges an app API key for a JWT access token.
// POST /auth/token
func (h *AuthHandler) CreateToken(c *gin.Context) {
	var req TokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find app by API key
	var app models.App
	if err := h.db.Where("api_key = ?", req.APIKey).First(&app).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
		return
	}

	// Generate JWT
	expiresAt := time.Now().Add(time.Duration(h.jwtExpiry) * time.Hour)
	claims := &middleware.JWTClaims{
		AppID: app.ID.String(),
		Role:  "cli",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   app.Name,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "hotpatch",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, TokenResponse{
		Token:     tokenString,
		TokenType: "Bearer",
		ExpiresIn: h.jwtExpiry * 3600,
		App: models.AppResponse{
			ID:       app.ID,
			Name:     app.Name,
			Platform: app.Platform,
		},
	})
}

// SuperLogin handles superadmin login with email and password.
// POST /auth/super/login
func (h *AuthHandler) SuperLogin(c *gin.Context) {
	var req SuperadminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Email != h.superadminEmail || req.Password != h.superadminPassword {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	expiresAt := time.Now().Add(time.Duration(h.jwtExpiry) * time.Hour)
	claims := &middleware.JWTClaims{
		AppID: "ffffffff-ffff-ffff-ffff-ffffffffffff", // System App ID
		Role:  "superadmin",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "Super Admin",
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "hotpatch",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, TokenResponse{
		Token:     tokenString,
		TokenType: "Bearer",
		ExpiresIn: h.jwtExpiry * 3600,
		App: models.AppResponse{
			ID:       uuid.MustParse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
			Name:     "System Admin",
			Platform: "system",
		},
	})
}

// CreateAppRequest is the body for POST /apps.
type CreateAppBody struct {
	Name     string `json:"name" binding:"required"`
	Platform string `json:"platform" binding:"required,oneof=android ios"`
}

// CreateApp registers a new app and returns its API key.
// POST /apps
func (h *AuthHandler) CreateApp(c *gin.Context) {
	var req CreateAppBody
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate a unique API key
	apiKeyBytes := make([]byte, 32)
	if _, err := rand.Read(apiKeyBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate API key"})
		return
	}
	apiKey := "hp_" + hex.EncodeToString(apiKeyBytes)

	app := models.App{
		ID:       uuid.New(),
		Name:     req.Name,
		Platform: req.Platform,
		APIKey:   apiKey,
	}

	if err := h.db.Create(&app).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "App name already exists"})
		return
	}

	// Initialize default channels (Production, Staging, Beta)
	if err := h.channelService.EnsureDefaultChannels(app.ID); err != nil {
		// Log error but don't fail the whole request (the app is created)
		fmt.Printf("⚠️  Failed to create default channels for app %s: %v\n", app.ID, err)
	}

	c.JSON(http.StatusCreated, models.AppResponse{
		ID:       app.ID,
		Name:     app.Name,
		Platform: app.Platform,
		APIKey:   apiKey,
	})
}
