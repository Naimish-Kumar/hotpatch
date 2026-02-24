package models

import (
	"time"

	"github.com/google/uuid"
)

// Channel represents a deployment lane (e.g., "production", "beta").
type Channel struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	AppID       uuid.UUID `json:"app_id" gorm:"type:uuid;not null;index"`
	Name        string    `json:"name" gorm:"not null;size:50"`
	Slug        string    `json:"slug" gorm:"not null;size:50;index"`
	Description string    `json:"description" gorm:"size:255"`
	Color       string    `json:"color" gorm:"size:20;default:'#00d4ff'"`
	AutoRollout bool      `json:"auto_rollout" gorm:"not null;default:true"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	App      App       `json:"-" gorm:"foreignKey:AppID"`
}

// CreateChannelRequest is the request body for creating a new channel.
type CreateChannelRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required,lowercase,alphanum"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

// UpdateChannelRequest is the request body for modifying a channel.
type UpdateChannelRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Color       *string `json:"color"`
	AutoRollout *bool   `json:"auto_rollout"`
}
