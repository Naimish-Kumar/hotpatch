package repository

import (
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"gorm.io/gorm"
)

// SettingsRepository handles application settings and webhooks.
type SettingsRepository struct {
	db *gorm.DB
}

// NewSettingsRepository creates a new SettingsRepository.
func NewSettingsRepository(db *gorm.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

// ── App Settings ──────────────────────────────────────

func (r *SettingsRepository) UpdateApp(app *models.App) error {
	return r.db.Save(app).Error
}

func (r *SettingsRepository) GetApp(id uuid.UUID) (*models.App, error) {
	var app models.App
	err := r.db.First(&app, "id = ?", id).Error
	return &app, err
}

// GetAppBySubscriptionID finds an app by its Stripe subscription ID.
func (r *SettingsRepository) GetAppBySubscriptionID(subscriptionID string) (*models.App, error) {
	var app models.App
	err := r.db.First(&app, "stripe_subscription_id = ?", subscriptionID).Error
	return &app, err
}

// ── Webhooks ──────────────────────────────────────────

func (r *SettingsRepository) CreateWebhook(webhook *models.Webhook) error {
	return r.db.Create(webhook).Error
}

func (r *SettingsRepository) ListWebhooks(appID uuid.UUID) ([]models.Webhook, error) {
	var webhooks []models.Webhook
	err := r.db.Where("app_id = ? AND is_active = true", appID).Find(&webhooks).Error
	return webhooks, err
}

func (r *SettingsRepository) DeleteWebhook(appID, webhookID uuid.UUID) error {
	return r.db.Model(&models.Webhook{}).
		Where("app_id = ? AND id = ?", appID, webhookID).
		Update("is_active", false).Error
}
