package api

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/hotpatch/server/internal/api/handlers"
	"github.com/hotpatch/server/internal/api/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// SetupRoutes configures all API routes on the Gin engine.
func SetupRoutes(
	r *gin.Engine,
	jwtSecret string,
	frontendURL string,
	redisClient *redis.Client,
	db *gorm.DB,
	startTime time.Time,
	authHandler *handlers.AuthHandler,
	releaseHandler *handlers.ReleaseHandler,
	updateHandler *handlers.UpdateHandler,
	deviceHandler *handlers.DeviceHandler,
	channelHandler *handlers.ChannelHandler,
	analyticsHandler *handlers.AnalyticsHandler,
	securityHandler *handlers.SecurityHandler,
	settingsHandler *handlers.SettingsHandler,
	adminHandler *handlers.AdminHandler,
	paymentHandler *handlers.PaymentHandler,
) {
	// ── Global middleware ──
	allowedOrigins := []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	if frontendURL != "" && frontendURL != "http://localhost:3000" {
		allowedOrigins = append(allowedOrigins, frontendURL)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-App-Key", "X-App-ID"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Prometheus metrics
	r.Use(middleware.PrometheusMiddleware())
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// ── Health check ──
	r.GET("/health", func(c *gin.Context) {
		dbStatus := "connected"
		sqlDB, err := db.DB()
		if err != nil || sqlDB.Ping() != nil {
			dbStatus = "disconnected"
		}

		redisStatus := "disabled"
		if redisClient != nil {
			if err := redisClient.Ping(c.Request.Context()).Err(); err != nil {
				redisStatus = "unreachable"
			} else {
				redisStatus = "connected"
			}
		}

		c.JSON(200, gin.H{
			"status":   "ok",
			"service":  "hotpatch-api",
			"database": dbStatus,
			"redis":    redisStatus,
			"uptime":   time.Since(startTime).String(),
		})
	})

	// ── Auth routes (no JWT required) ──
	auth := r.Group("/auth")
	{
		auth.POST("/token", authHandler.CreateToken)
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.GET("/verify", authHandler.VerifyEmail)
		auth.POST("/admin/login", authHandler.SuperLogin)
		auth.GET("/google/login", authHandler.GoogleLogin)
		auth.GET("/google/callback", authHandler.GoogleCallback)
	}

	// ── Billing Webhook (unauthenticated, Stripe signed) ──
	r.POST("/billing/webhook", paymentHandler.HandleWebhook)

	// ── App registration (no JWT required for initial setup) ──
	r.POST("/apps", authHandler.CreateApp)

	// ── SDK routes (App Key auth — high throughput) ──
	sdk := r.Group("/")
	sdk.Use(middleware.RateLimitMiddleware(60, 1*time.Minute, redisClient)) // 60 req/min per IP
	{
		sdk.GET("/update/check", updateHandler.CheckForUpdate)
		sdk.POST("/devices", deviceHandler.RegisterDevice)
		sdk.POST("/installations", deviceHandler.ReportInstallation)
	}

	// ── CLI / Dashboard routes (JWT required) ──
	api := r.Group("/")
	api.Use(middleware.AuthMiddleware(jwtSecret))
	{
		// Releases
		api.POST("/releases", releaseHandler.Create)
		api.GET("/releases", releaseHandler.List)
		api.GET("/releases/:id", releaseHandler.GetByID)
		api.PATCH("/releases/:id/rollback", releaseHandler.Rollback)
		api.PATCH("/releases/:id/rollout", releaseHandler.UpdateRollout)
		api.DELETE("/releases/:id", releaseHandler.Archive)
		api.POST("/releases/:id/patches", releaseHandler.AddPatch)

		// Devices (dashboard view)
		api.GET("/devices", deviceHandler.ListDevices)

		// Release stats
		api.GET("/releases/:id/stats", deviceHandler.GetInstallationStats)

		// Channels
		api.POST("/channels", channelHandler.Create)
		api.GET("/channels", channelHandler.List)
		api.GET("/channels/:slug", channelHandler.Get)
		api.PATCH("/channels/:slug", channelHandler.Update)
		api.DELETE("/channels/:slug", channelHandler.Delete)

		// Analytics
		api.GET("/analytics/overview", analyticsHandler.GetOverview)
		api.GET("/analytics/distribution", analyticsHandler.GetDistribution)
		api.GET("/analytics/trends", analyticsHandler.GetTrends)
		api.GET("/analytics/releases/:id", analyticsHandler.GetReleaseAnalytics)

		// Security
		api.POST("/security/api-keys", securityHandler.CreateApiKey)
		api.GET("/security/api-keys", securityHandler.ListApiKeys)
		api.DELETE("/security/api-keys/:id", securityHandler.DeleteApiKey)
		api.POST("/security/signing-keys", securityHandler.CreateSigningKey)
		api.GET("/security/signing-keys", securityHandler.ListSigningKeys)
		api.DELETE("/security/signing-keys/:id", securityHandler.DeleteSigningKey)
		api.GET("/security/audit-logs", securityHandler.ListAuditLogs)

		// Settings & Webhooks
		api.GET("/settings/app", settingsHandler.GetAppSettings)
		api.PATCH("/settings/app", settingsHandler.UpdateApp)
		api.POST("/settings/webhooks", settingsHandler.CreateWebhook)
		api.GET("/settings/webhooks", settingsHandler.ListWebhooks)
		api.DELETE("/settings/webhooks/:id", settingsHandler.DeleteWebhook)

		// Billing
		api.POST("/billing/checkout", paymentHandler.CreateCheckoutSession)
		api.POST("/billing/portal", paymentHandler.CreatePortalSession)
	}

	// ── Superadmin Panel roots (JWT + Superadmin Role required) ──
	admin := r.Group("/admin")
	admin.Use(middleware.AuthMiddleware(jwtSecret))
	{
		// Only allow superadmin role
		admin.Use(func(c *gin.Context) {
			role, _ := c.Get("role")
			if role != "superadmin" {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Superadmin access required"})
				return
			}
			c.Next()
		})

		admin.GET("/apps", adminHandler.ListAllApps)
		admin.PATCH("/apps/:id", adminHandler.UpdateApp)
		admin.DELETE("/apps/:id", adminHandler.DeleteApp)
		admin.GET("/users", adminHandler.ListAllUsers)
		admin.DELETE("/users/:id", adminHandler.DeleteUser)
		admin.GET("/stats", adminHandler.GetSystemStats)

		// System Configuration
		admin.GET("/settings", adminHandler.ListSettings)
		admin.PUT("/settings/:key", adminHandler.UpdateSetting)
	}
}
