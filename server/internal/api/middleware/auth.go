package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims defines the custom JWT claims.
type JWTClaims struct {
	AppID string `json:"app_id"`
	Role  string `json:"role"` // "cli" | "dashboard" | "sdk"
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT tokens for CLI and dashboard access.
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			return
		}

		// Extract Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header must be in format: Bearer <token>",
			})
			return
		}

		tokenString := parts[1]

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			return
		}

		claims, ok := token.Claims.(*JWTClaims)
		if !ok || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token claims",
			})
			return
		}

		// Set claims in context for downstream handlers
		c.Set("app_id", claims.AppID)
		c.Set("role", claims.Role)
		c.Set("subject", claims.Subject)

		c.Next()
	}
}

// AppKeyMiddleware validates app API keys for SDK update-check requests.
// This is a lighter-weight auth for the high-throughput /update/check endpoint.
func AppKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-App-Key")
		if apiKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "X-App-Key header is required",
			})
			return
		}

		// The API key is validated against the apps table in the handler
		c.Set("api_key", apiKey)
		c.Next()
	}
}
