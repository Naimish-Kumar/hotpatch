package models

import (
	"time"

	"github.com/google/uuid"
)

// App represents a registered application in the system.
type App struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"uniqueIndex;not null;size:255"`
	Platform  string    `json:"platform" gorm:"not null;size:10"` // "android" | "ios"
	APIKey    string    `json:"-" gorm:"uniqueIndex;not null;size:64"`
	OwnerID   uuid.UUID `json:"owner_id" gorm:"type:uuid;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	Releases []Release `json:"releases,omitempty" gorm:"foreignKey:AppID"`
	Devices  []Device  `json:"devices,omitempty" gorm:"foreignKey:AppID"`
}

// CreateAppRequest is the request body for creating a new app.
type CreateAppRequest struct {
	Name     string `json:"name" binding:"required"`
	Platform string `json:"platform" binding:"required,oneof=android ios"`
}

// AppResponse is the response body after creating an app.
type AppResponse struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Platform  string    `json:"platform"`
	APIKey    string    `json:"api_key,omitempty"` // Only returned on creation
	CreatedAt time.Time `json:"created_at"`
}
