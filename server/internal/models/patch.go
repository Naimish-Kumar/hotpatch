package models

import (
	"time"

	"github.com/google/uuid"
)

// Patch represents a binary diff between an old version and a new release.
type Patch struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	ReleaseID   uuid.UUID `json:"release_id" gorm:"type:uuid;not null;index"`
	BaseVersion string    `json:"base_version" gorm:"not null;size:50"` // The version this patch applies to
	PatchURL    string    `json:"patch_url" gorm:"not null"`
	Hash        string    `json:"hash" gorm:"not null;size:64"`
	Signature   string    `json:"signature" gorm:"not null"`
	Size        int64     `json:"size" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`

	Release Release `json:"-" gorm:"foreignKey:ReleaseID"`
}

// AddPatchRequest is the request to add a patch artifact to an existing release.
type AddPatchRequest struct {
	BaseVersion string `json:"base_version" binding:"required"`
	Hash        string `json:"hash" binding:"required"`
	Signature   string `json:"signature" binding:"required"`
	Size        int64  `json:"size" binding:"required"`
}
