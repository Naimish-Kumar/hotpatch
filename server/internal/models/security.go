package models

import (
	"time"

	"github.com/google/uuid"
)

// ApiKey represents an authentication token for the CLI or Dashboard.
type ApiKey struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AppID     uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"not null;size:100"` // e.g., "GitHub Actions", "Team Member A"
	Key       string    `json:"-" gorm:"uniqueIndex;not null;size:64"`
	Prefix    string    `json:"prefix" gorm:"size:8"` // e.g., "hp_7a3d"
	LastUsed  *time.Time `json:"last_used"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	ExpiresAt *time.Time `json:"expires_at"`

	App App `json:"-" gorm:"foreignKey:AppID"`
}

// SigningKey represents an Ed25519 public key used to verify updates.
type SigningKey struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AppID     uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"not null;size:100"`
	PublicKey string    `json:"public_key" gorm:"not null"` // PEM or Base64 encoded public key
	IsActive  bool      `json:"is_active" gorm:"not null;default:true"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	App App `json:"-" gorm:"foreignKey:AppID"`
}

// AuditLog records sensitive actions performed in the system.
type AuditLog struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AppID     uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	Actor     string    `json:"actor"`   // API Key Name or User Identity
	Action    string    `json:"action"`  // e.g., "release.create", "channel.delete"
	EntityID  string    `json:"entity_id"`
	Metadata  string    `json:"metadata" gorm:"type:text"` // JSON details of the change
	IPAddress string    `json:"ip_address"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`

	App App `json:"-" gorm:"foreignKey:AppID"`
}

// CreateApiKeyRequest is the body for creating a new API key.
type CreateApiKeyRequest struct {
	Name      string     `json:"name" binding:"required"`
	ExpiresAt *time.Time `json:"expires_at"`
}

// CreateSigningKeyRequest is the body for registering a public signing key.
type CreateSigningKeyRequest struct {
	Name      string `json:"name" binding:"required"`
	PublicKey string `json:"public_key" binding:"required"`
}
