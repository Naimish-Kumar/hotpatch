package models

import (
	"time"

	"github.com/google/uuid"
)

// Release represents a published OTA bundle release.
type Release struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AppID             uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	Version           string    `json:"version" gorm:"not null;size:50"`
	Channel           string    `json:"channel" gorm:"not null;size:50;default:'production'"`
	BundleURL         string    `json:"bundle_url" gorm:"not null"`
	Hash              string    `json:"hash" gorm:"not null;size:64"`             // SHA256 hex
	Signature         string    `json:"signature" gorm:"not null"`                // Ed25519 base64
	Mandatory         bool      `json:"mandatory" gorm:"not null;default:false"`
	RolloutPercentage int       `json:"rollout_percentage" gorm:"not null;default:100;type:smallint"`
	IsEncrypted       bool      `json:"is_encrypted" gorm:"not null;default:false"`
	IsPatch           bool      `json:"is_patch" gorm:"not null;default:false"`
	BaseVersion       string    `json:"base_version" gorm:"size:50"` // Only for patches
	KeyID             *string   `json:"key_id" gorm:"size:50"`
	Size              int64     `json:"size" gorm:"not null;default:0"`
	IsActive          bool      `json:"is_active" gorm:"not null;default:true;index"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`

	App           App            `json:"-" gorm:"foreignKey:AppID"`
	Installations []Installation `json:"installations,omitempty" gorm:"foreignKey:ReleaseID"`
	Patches       []Patch        `json:"patches,omitempty" gorm:"foreignKey:ReleaseID"`
}

// CreateReleaseRequest is the JSON metadata part of a multipart release upload.
type CreateReleaseRequest struct {
	Version           string `json:"version" binding:"required"`
	Channel           string `json:"channel" binding:"omitempty"`
	Platform          string `json:"platform" binding:"required,oneof=android ios"`
	Mandatory         bool   `json:"mandatory"`
	RolloutPercentage int    `json:"rollout_percentage" binding:"omitempty,min=1,max=100"`
	Hash              string `json:"hash" binding:"required"`
	Signature         string `json:"signature" binding:"required"`
	IsEncrypted       bool   `json:"is_encrypted"`
	IsPatch           bool   `json:"is_patch"`
	BaseVersion       string `json:"base_version"`
	KeyID             string `json:"key_id"`
	Size              int64  `json:"size" binding:"required"`
}

// ReleaseListQuery holds query parameters for listing releases.
type ReleaseListQuery struct {
	AppID    string `form:"app_id"`
	Channel  string `form:"channel"`
	IsActive string `form:"is_active"`
	Page     int    `form:"page,default=1"`
	PerPage  int    `form:"per_page,default=20"`
}

// UpdateRolloutRequest is the request body for patching rollout percentage.
type UpdateRolloutRequest struct {
	RolloutPercentage int `json:"rollout_percentage" binding:"required,min=1,max=100"`
}
