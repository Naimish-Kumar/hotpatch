package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/api/middleware"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/services"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

// hashAppAPIKey hashes an app-level API key using the same SHA-256 method
// as the security service for consistency.
func hashAppAPIKey(rawKey string) string {
	return services.HashApiKey(rawKey)
}

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	db                 *gorm.DB
	channelService     *services.ChannelService
	emailService       *services.EmailService
	jwtSecret          string
	jwtExpiry          int // hours
	superadminEmail    string
	superadminPassword string
	backendURL         string
	frontendURL        string
	googleConfig       *oauth2.Config
}

type TokenRequest struct {
	APIKey string `json:"api_key" binding:"required"`
}

type TokenResponse struct {
	Token     string             `json:"token"`
	TokenType string             `json:"token_type"`
	ExpiresIn int                `json:"expires_in"`
	App       models.AppResponse `json:"app"`
}

type SuperadminLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(db *gorm.DB, channelService *services.ChannelService, emailService *services.EmailService, jwtSecret string, jwtExpiry int, superadminEmail string, superadminPassword string, backendURL string, frontendURL string, googleClientID string, googleClientSecret string) *AuthHandler {
	var googleConfig *oauth2.Config
	if googleClientID != "" && googleClientSecret != "" {
		googleConfig = &oauth2.Config{
			ClientID:     googleClientID,
			ClientSecret: googleClientSecret,
			RedirectURL:  fmt.Sprintf("%s/auth/google/callback", backendURL),
			Endpoint:     google.Endpoint,
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
		}
	}

	return &AuthHandler{
		db:                 db,
		channelService:     channelService,
		emailService:       emailService,
		jwtSecret:          jwtSecret,
		jwtExpiry:          jwtExpiry,
		superadminEmail:    superadminEmail,
		superadminPassword: superadminPassword,
		backendURL:         backendURL,
		frontendURL:        frontendURL,
		googleConfig:       googleConfig,
	}
}

// Register creates a new user and sends a verification email.
// POST /auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Generate verification token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate verification token"})
		return
	}
	verificationToken := hex.EncodeToString(tokenBytes)

	user := models.User{
		ID:                uuid.New(),
		Email:             req.Email,
		PasswordHash:      string(hash),
		DisplayName:       req.Name,
		IsVerified:        false,
		VerificationToken: verificationToken,
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Send verification email
	if err := h.emailService.SendVerificationEmail(user.Email, verificationToken); err != nil {
		fmt.Printf("⚠️  Failed to send verification email: %v\n", err)
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Account created! Please check your email to verify your account."})
}

// Login authenticates a user with email and password.
// POST /auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Check if verified
	if !user.IsVerified {
		c.JSON(http.StatusForbidden, gin.H{"error": "Please verify your email before logging in"})
		return
	}

	// Generate JWT
	tokenString, err := h.generateJWT(user.ID.String(), user.Email, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	user.LastLoginAt = time.Now()
	h.db.Save(&user)

	// Fetch first app for this user to provide context to dashboard
	var firstApp models.App
	var appResponse *models.AppResponse
	if err := h.db.Where("owner_id = ?", user.ID).First(&firstApp).Error; err == nil {
		appResponse = &models.AppResponse{
			ID:        firstApp.ID,
			Name:      firstApp.Name,
			Platform:  firstApp.Platform,
			CreatedAt: firstApp.CreatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      tokenString,
		"token_type": "Bearer",
		"expires_in": h.jwtExpiry * 3600,
		"user": models.UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
			AvatarURL:   user.AvatarURL,
			IsVerified:  user.IsVerified,
		},
		"app": appResponse,
	})
}

// VerifyEmail verifies a user's account using the token.
// GET /auth/verify?token=...
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Verification token missing"})
		return
	}

	var user models.User
	if err := h.db.Where("verification_token = ?", token).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invalid or expired verification token"})
		return
	}

	user.IsVerified = true
	user.VerificationToken = "" // Clear token once used
	if err := h.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify account"})
		return
	}

	// Redirect to a success page or dashboard
	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/login?verified=true", h.frontendURL))
}

func (h *AuthHandler) generateJWT(appID, subject, role string) (string, error) {
	expiresAt := time.Now().Add(time.Duration(h.jwtExpiry) * time.Hour)
	claims := &middleware.JWTClaims{
		AppID: appID,
		Role:  role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   subject,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "hotpatch",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}

// SuperLogin authenticates the superadmin.
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

	tokenString, err := h.generateJWT("ffffffff-ffff-ffff-ffff-ffffffffffff", "Super Admin", "superadmin")
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

// GoogleLogin redirects to Google's OAuth2 consent screen.
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	if h.googleConfig == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google OAuth not configured"})
		return
	}

	state := c.Query("state")
	if state == "" {
		state = "hotpatch-web"
	}

	url := h.googleConfig.AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback handles the callback from Google OAuth.
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	if h.googleConfig == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google OAuth not configured"})
		return
	}

	code := c.Query("code")
	state := c.Query("state")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code missing"})
		return
	}

	token, err := h.googleConfig.Exchange(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token"})
		return
	}

	client := h.googleConfig.Client(c.Request.Context(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user info"})
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode user info"})
		return
	}

	var user models.User
	result := h.db.Where("google_id = ?", googleUser.ID).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			user = models.User{
				ID:          uuid.New(),
				Email:       googleUser.Email,
				DisplayName: googleUser.Name,
				AvatarURL:   googleUser.Picture,
				GoogleID:    googleUser.ID,
				IsVerified:  true, // Google accounts are considered verified
				LastLoginAt: time.Now(),
			}
			h.db.Create(&user)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	} else {
		user.LastLoginAt = time.Now()
		h.db.Save(&user)
	}

	tokenString, err := h.generateJWT(user.ID.String(), user.Email, "user")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	if strings.HasPrefix(state, "cli:") {
		port := strings.TrimPrefix(state, "cli:")
		if port == "" {
			port = "8081"
		}
		c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("http://localhost:%s/callback?token=%s", port, tokenString))
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/login/callback?token=%s", h.frontendURL, tokenString))
}

// CreateToken handles API key authentication.
func (h *AuthHandler) CreateToken(c *gin.Context) {
	var req TokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var app models.App
	// Hash the incoming key and look up by hash (keys are stored hashed)
	hashedKey := hashAppAPIKey(req.APIKey)
	if err := h.db.Where("api_key = ?", hashedKey).First(&app).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
		return
	}

	tokenString, err := h.generateJWT(app.ID.String(), app.Name, "cli")
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

// CreateApp registers a new application.
func (h *AuthHandler) CreateApp(c *gin.Context) {
	var req models.CreateAppRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rawAPIKey := "hp_" + uuid.New().String()
	// Hash the API key before storing — raw key is returned only once at creation
	hashedAPIKey := hashAppAPIKey(rawAPIKey)

	tier := req.Tier
	if tier == "" {
		tier = "free"
	}

	app := models.App{
		ID:       uuid.New(),
		Name:     req.Name,
		Platform: req.Platform,
		APIKey:   hashedAPIKey,
		Tier:     tier,
	}

	// Try to get owner ID from context (if route is protected)
	if ownerID, exists := c.Get("owner_id"); exists {
		if uid, err := uuid.Parse(ownerID.(string)); err == nil {
			app.OwnerID = uid
		}
	}

	if err := h.db.Create(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create app"})
		return
	}

	if err := h.channelService.EnsureDefaultChannels(app.ID); err != nil {
		fmt.Printf("⚠️  Failed to create default channels: %v\n", err)
	}

	c.JSON(http.StatusCreated, models.AppResponse{
		ID:        app.ID,
		Name:      app.Name,
		Platform:  app.Platform,
		Tier:      app.Tier,
		APIKey:    rawAPIKey, // Return raw key only at creation time
		CreatedAt: app.CreatedAt,
	})
}
