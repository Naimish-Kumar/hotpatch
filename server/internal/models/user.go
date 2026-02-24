package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user account in the system.
type User struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email             string    `json:"email" gorm:"uniqueIndex;not null;size:255"`
	PasswordHash      string    `json:"-" gorm:"size:255"`
	DisplayName       string    `json:"display_name" gorm:"size:255"`
	AvatarURL         string    `json:"avatar_url" gorm:"size:512"`
	GoogleID          string    `json:"google_id" gorm:"uniqueIndex;size:255"`
	IsVerified        bool      `json:"is_verified" gorm:"default:false"`
	VerificationToken string    `json:"-" gorm:"size:255"`
	LastLoginAt       time.Time `json:"last_login_at"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	Apps []App `json:"apps,omitempty" gorm:"foreignKey:OwnerID"`
}

// UserResponse is the public representation of a user.
type UserResponse struct {
	ID          uuid.UUID `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	AvatarURL   string    `json:"avatar_url"`
	IsVerified  bool      `json:"is_verified"`
}

// RegisterRequest is the body for POST /auth/register.
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Name     string `json:"name" binding:"required"`
}

// LoginRequest is the body for POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
