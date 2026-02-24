package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the server.
type Config struct {
	// Server
	Port string

	// Database
	DatabaseURL string

	// JWT
	JWTSecret     string
	JWTExpiration int // hours

	// S3 / Cloudflare R2
	S3Bucket     string
	S3Endpoint   string
	S3Region     string
	AWSAccessKey string
	AWSSecretKey string

	// Redis (optional)
	RedisURL string

	// App
	Environment        string // "development" | "production"
	SuperadminEmail    string
	SuperadminPassword string
}

// Load reads config from environment variables (with .env file support).
func Load() (*Config, error) {
	// Load .env file if it exists (ignored in production)
	_ = godotenv.Load()

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		JWTExpiration:      getEnvInt("JWT_EXPIRATION_HOURS", 72),
		S3Bucket:           getEnv("S3_BUCKET", "hotpatch-bundles"),
		S3Endpoint:         getEnv("S3_ENDPOINT", ""),
		S3Region:           getEnv("S3_REGION", "auto"),
		AWSAccessKey:       getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:       getEnv("AWS_SECRET_ACCESS_KEY", ""),
		RedisURL:           getEnv("REDIS_URL", ""),
		Environment:        getEnv("ENVIRONMENT", "development"),
		SuperadminEmail:    getEnv("SUPERADMIN_EMAIL", "admin@hotpatch.io"),
		SuperadminPassword: getEnv("SUPERADMIN_PASSWORD", "admin123"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required (min 32 characters)")
	}
	if len(cfg.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 characters")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
	}
	return fallback
}
