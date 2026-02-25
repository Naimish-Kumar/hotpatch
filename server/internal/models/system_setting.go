package models

import "time"

// SystemSetting represents a global configuration key-value pair stored in the database.
type SystemSetting struct {
	Key         string    `json:"key" gorm:"primaryKey;size:255"`
	Value       string    `json:"value" gorm:"not null;size:1024"`
	Description string    `json:"description" gorm:"size:512"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// UpdateSystemSettingRequest is the body for updating a setting.
type UpdateSystemSettingRequest struct {
	Value string `json:"value" binding:"required"`
}
