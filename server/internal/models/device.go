package models

import (
	"time"

	"github.com/google/uuid"
)

// Device represents a registered device that checks for updates.
type Device struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	DeviceID       string    `json:"device_id" gorm:"uniqueIndex;not null;size:255"` // SDK-generated UUID
	AppID          uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	Platform       string    `json:"platform" gorm:"not null;size:10"`
	CurrentVersion string    `json:"current_version" gorm:"size:50"`
	LastSeen       time.Time `json:"last_seen" gorm:"autoUpdateTime"`

	App           App            `json:"-" gorm:"foreignKey:AppID"`
	Installations []Installation `json:"installations,omitempty" gorm:"foreignKey:DeviceID"`
}

// Installation represents a record of an OTA update applied to a device.
type Installation struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	DeviceID    uuid.UUID `json:"device_id" gorm:"type:uuid;not null;index"`
	ReleaseID   uuid.UUID `json:"release_id" gorm:"type:uuid;not null;index"`
	Status       string    `json:"status" gorm:"not null;size:20"` // "applied" | "failed" | "rolled_back"
	IsPatch      bool      `json:"is_patch" gorm:"not null;default:false"`
	DownloadSize int64     `json:"download_size" gorm:"not null;default:0"`
	InstalledAt  time.Time `json:"installed_at" gorm:"autoCreateTime"`

	Device  Device  `json:"-" gorm:"foreignKey:DeviceID"`
	Release Release `json:"-" gorm:"foreignKey:ReleaseID"`
}

// RegisterDeviceRequest is the request body for device registration.
type RegisterDeviceRequest struct {
	DeviceID       string `json:"device_id" binding:"required"`
	AppID          string `json:"app_id" binding:"required"`
	Platform       string `json:"platform" binding:"required,oneof=android ios"`
	CurrentVersion string `json:"current_version"`
}

// ReportInstallationRequest is the request body for reporting an installation result.
type ReportInstallationRequest struct {
	DeviceID  string `json:"device_id" binding:"required"`
	ReleaseID    string `json:"release_id" binding:"required"`
	Status       string `json:"status" binding:"required,oneof=applied failed rolled_back"`
	IsPatch      bool   `json:"is_patch"`
	DownloadSize int64  `json:"download_size"`
}

// UpdateCheckRequest is the request body for the /update/check endpoint.
type UpdateCheckRequest struct {
	AppID    string `json:"appId" binding:"required"`
	DeviceID string `json:"deviceId" binding:"required"`
	Version  string `json:"version" binding:"required"`
	Platform string `json:"platform" binding:"required,oneof=android ios"`
	Channel  string `json:"channel" binding:"required"`
}

// UpdateCheckResponse is the response for the /update/check endpoint.
type UpdateCheckResponse struct {
	ID              string `json:"id,omitempty"`
	UpdateAvailable bool   `json:"updateAvailable"`
	BundleURL       string `json:"bundleUrl,omitempty"`
	Hash            string `json:"hash,omitempty"`
	Signature       string `json:"signature,omitempty"`
	Mandatory       bool   `json:"mandatory,omitempty"`
	Version         string `json:"version,omitempty"`
	IsEncrypted     bool   `json:"isEncrypted,omitempty"`
	IsPatch         bool   `json:"isPatch,omitempty"`
	BaseVersion     string `json:"baseVersion,omitempty"`
}
