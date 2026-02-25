package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
)

// ChannelService handles channel management business logic.
type ChannelService struct {
	repo            *repository.ChannelRepository
	settingsService *SettingsService
}

// NewChannelService creates a new ChannelService.
func NewChannelService(repo *repository.ChannelRepository, settingsService *SettingsService) *ChannelService {
	return &ChannelService{repo: repo, settingsService: settingsService}
}

// Create validates and creates a new channel for an app.
func (s *ChannelService) Create(ctx context.Context, appID uuid.UUID, req *models.CreateChannelRequest) (*models.Channel, error) {
	// Fetch app to check tier
	app, err := s.settingsService.GetApp(appID)
	if err != nil {
		return nil, fmt.Errorf("app not found: %w", err)
	}

	// Enforce channel limits
	channels, _ := s.repo.ListByApp(appID)
	if app.Tier == "free" && len(channels) >= 1 {
		return nil, fmt.Errorf("free tier apps are limited to 1 channel (Production)")
	}
	if app.Tier == "pro" && len(channels) >= 3 {
		return nil, fmt.Errorf("pro tier apps are limited to 3 channels")
	}

	// Check if slug already exists for this app
	existing, _ := s.repo.GetBySlug(appID, req.Slug)
	if existing != nil {
		return nil, fmt.Errorf("channel with slug '%s' already exists for this application", req.Slug)
	}

	channel := &models.Channel{
		ID:          uuid.New(),
		AppID:       appID,
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Color:       req.Color,
		AutoRollout: true,
	}

	if err := s.repo.Create(channel); err != nil {
		return nil, fmt.Errorf("failed to create channel: %w", err)
	}

	return channel, nil
}

// ListByApp retrieves all channels for an app.
func (s *ChannelService) ListByApp(appID uuid.UUID) ([]models.Channel, error) {
	return s.repo.ListByApp(appID)
}

// GetBySlug retrieves a channel by its slug.
func (s *ChannelService) GetBySlug(appID uuid.UUID, slug string) (*models.Channel, error) {
	return s.repo.GetBySlug(appID, slug)
}

// Update modifies channel details.
func (s *ChannelService) Update(appID uuid.UUID, slug string, req *models.UpdateChannelRequest) (*models.Channel, error) {
	channel, err := s.repo.GetBySlug(appID, slug)
	if err != nil {
		return nil, fmt.Errorf("channel not found: %w", err)
	}

	if req.Name != nil {
		channel.Name = *req.Name
	}
	if req.Description != nil {
		channel.Description = *req.Description
	}
	if req.Color != nil {
		channel.Color = *req.Color
	}
	if req.AutoRollout != nil {
		channel.AutoRollout = *req.AutoRollout
	}

	if err := s.repo.Update(channel); err != nil {
		return nil, fmt.Errorf("failed to update channel: %w", err)
	}

	return channel, nil
}

// Delete removes a channel.
func (s *ChannelService) Delete(appID uuid.UUID, slug string) error {
	channel, err := s.repo.GetBySlug(appID, slug)
	if err != nil {
		return fmt.Errorf("channel not found: %w", err)
	}

	// Prevent deleting default production channel
	if channel.Slug == "production" {
		return fmt.Errorf("the production channel cannot be deleted")
	}

	return s.repo.Delete(channel.ID)
}

// EnsureDefaultChannels initializes production/staging/beta if missing.
func (s *ChannelService) EnsureDefaultChannels(appID uuid.UUID) error {
	app, err := s.settingsService.GetApp(appID)
	if err != nil {
		return err
	}
	return s.repo.EnsureDefaultChannels(app)
}
