package models

import (
	"time"

	"github.com/google/uuid"
)

// App represents a registered application in the system.
type App struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Name          string    `json:"name" gorm:"uniqueIndex;not null;size:255"`
	Platform      string    `json:"platform" gorm:"not null;size:10"` // "android" | "ios"
	APIKey        string    `json:"-" gorm:"uniqueIndex;not null;size:64"`
	EncryptionKey string    `json:"-" gorm:"size:64"`
	OwnerID       uuid.UUID `json:"owner_id" gorm:"type:uuid;not null"`
	Tier          string    `json:"tier" gorm:"not null;size:20;default:'free'"` // "free" | "pro" | "enterprise"

	// Stripe integration
	StripeCustomerID     string    `json:"stripe_customer_id" gorm:"size:100"`
	StripeSubscriptionID string    `json:"stripe_subscription_id" gorm:"size:100"`
	SubscriptionStatus   string    `json:"subscription_status" gorm:"size:20;default:'active'"`
	SubscriptionEnd      time.Time `json:"subscription_end"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	Releases []Release `json:"releases,omitempty" gorm:"foreignKey:AppID"`
	Devices  []Device  `json:"devices,omitempty" gorm:"foreignKey:AppID"`
}

// CreateAppRequest is the request body for creating a new app.
type CreateAppRequest struct {
	Name     string `json:"name" binding:"required"`
	Platform string `json:"platform" binding:"required,oneof=android ios"`
	Tier     string `json:"tier" binding:"omitempty,oneof=free pro enterprise"`
}

// AppResponse is the response body after creating an app.
type AppResponse struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Platform string    `json:"platform"`
	Tier     string    `json:"tier"`

	// Subscription info
	SubscriptionStatus string    `json:"subscription_status,omitempty"`
	SubscriptionEnd    time.Time `json:"subscription_end,omitempty"`

	APIKey        string    `json:"api_key,omitempty"`        // Only returned on creation
	EncryptionKey string    `json:"encryption_key,omitempty"` // Only returned on creation
	CreatedAt     time.Time `json:"created_at"`
}
