package models

import (
	"time"

	"github.com/google/uuid"
)

// Webhook represents an outbound notification endpoint.
type Webhook struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AppID     uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	URL       string    `json:"url" gorm:"not null"`
	Secret    string    `json:"-" gorm:"size:64"` // Used for HMAC signing of payloads
	Events    string    `json:"events" gorm:"type:text"` // Comma-separated: "release.created,release.rolled_back"
	IsActive  bool      `json:"is_active" gorm:"not null;default:true"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	App App `json:"-" gorm:"foreignKey:AppID"`
}

// UpdateAppRequest is the body for patching application settings.
type UpdateAppRequest struct {
	Name *string `json:"name"`
}

// CreateWebhookRequest is the body for creating a new webhook.
type CreateWebhookRequest struct {
	URL    string   `json:"url" binding:"required,url"`
	Events []string `json:"events" binding:"required"`
}

// WebhookEvent represents the payload sent to a webhook.
type WebhookEvent struct {
	ID        string      `json:"id"`
	Timestamp time.Time   `json:"timestamp"`
	Event     string      `json:"event"`
	Payload   interface{} `json:"payload"`
}
