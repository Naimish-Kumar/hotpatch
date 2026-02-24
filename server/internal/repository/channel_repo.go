package repository

import (
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"gorm.io/gorm"
)

// ChannelRepository handles database operations for channels.
type ChannelRepository struct {
	db *gorm.DB
}

// NewChannelRepository creates a new ChannelRepository.
func NewChannelRepository(db *gorm.DB) *ChannelRepository {
	return &ChannelRepository{db: db}
}

// Create inserts a new channel into the database.
func (r *ChannelRepository) Create(channel *models.Channel) error {
	return r.db.Create(channel).Error
}

// GetByID retrieves a channel by its UUID.
func (r *ChannelRepository) GetByID(id uuid.UUID) (*models.Channel, error) {
	var channel models.Channel
	err := r.db.First(&channel, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &channel, nil
}

// GetBySlug retrieves a channel by its slug for a specific app.
func (r *ChannelRepository) GetBySlug(appID uuid.UUID, slug string) (*models.Channel, error) {
	var channel models.Channel
	err := r.db.Where("app_id = ? AND slug = ?", appID, slug).First(&channel).Error
	if err != nil {
		return nil, err
	}
	return &channel, nil
}

// ListByApp retrieves all channels for a specific application.
func (r *ChannelRepository) ListByApp(appID uuid.UUID) ([]models.Channel, error) {
	var channels []models.Channel
	err := r.db.Where("app_id = ?", appID).Order("created_at ASC").Find(&channels).Error
	return channels, err
}

// Update modifies an existing channel.
func (r *ChannelRepository) Update(channel *models.Channel) error {
	return r.db.Save(channel).Error
}

// Delete removes a channel (usually soft delete or caution if releases exist).
func (r *ChannelRepository) Delete(id uuid.UUID) error {
	// For now, simple delete. In production, check for associated releases.
	return r.db.Delete(&models.Channel{}, "id = ?", id).Error
}

// EnsureDefaultChannels creates production, staging, and beta channels if they don't exist.
func (r *ChannelRepository) EnsureDefaultChannels(appID uuid.UUID) error {
	defaults := []models.Channel{
		{AppID: appID, Name: "Production", Slug: "production", Color: "#00e5a0", Description: "Main release channel for all users."},
		{AppID: appID, Name: "Staging", Slug: "staging", Color: "#ffb830", Description: "Internal testing and QA channel."},
		{AppID: appID, Name: "Beta", Slug: "beta", Color: "#00d4ff", Description: "Early access channel for beta testers."},
	}

	for _, ch := range defaults {
		var existing models.Channel
		err := r.db.Where("app_id = ? AND slug = ?", appID, ch.Slug).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := r.db.Create(&ch).Error; err != nil {
				return err
			}
		}
	}
	return nil
}
