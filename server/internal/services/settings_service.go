package services

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
)

// SettingsService handles app settings and webhook dispatching.
type SettingsService struct {
	repo *repository.SettingsRepository
}

// NewSettingsService creates a new SettingsService.
func NewSettingsService(repo *repository.SettingsRepository) *SettingsService {
	return &SettingsService{repo: repo}
}

// ── App Settings ──────────────────────────────────────

func (s *SettingsService) UpdateApp(ctx context.Context, appID uuid.UUID, req *models.UpdateAppRequest) (*models.App, error) {
	app, err := s.repo.GetApp(appID)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		app.Name = *req.Name
	}

	if err := s.repo.UpdateApp(app); err != nil {
		return nil, err
	}

	return app, nil
}

// ── Webhooks ──────────────────────────────────────────

func (s *SettingsService) CreateWebhook(ctx context.Context, appID uuid.UUID, req *models.CreateWebhookRequest) (*models.Webhook, string, error) {
	// Generate a secret for HMAC signing
	secretBytes := make([]byte, 32)
	rand.Read(secretBytes)
	secret := hex.EncodeToString(secretBytes)

	webhook := &models.Webhook{
		ID:       uuid.New(),
		AppID:    appID,
		URL:      req.URL,
		Secret:   secret,
		Events:   strings.Join(req.Events, ","),
		IsActive: true,
	}

	if err := s.repo.CreateWebhook(webhook); err != nil {
		return nil, "", err
	}

	return webhook, secret, nil
}

func (s *SettingsService) ListWebhooks(appID uuid.UUID) ([]models.Webhook, error) {
	return s.repo.ListWebhooks(appID)
}

func (s *SettingsService) DeleteWebhook(appID, webhookID uuid.UUID) error {
	return s.repo.DeleteWebhook(appID, webhookID)
}

// DispatchEvent sends a webhook notification to all registered listeners.
func (s *SettingsService) DispatchEvent(appID uuid.UUID, eventType string, payload interface{}) {
	webhooks, _ := s.repo.ListWebhooks(appID)
	
	event := models.WebhookEvent{
		ID:        uuid.New().String(),
		Timestamp: time.Now(),
		Event:     eventType,
		Payload:   payload,
	}

	jsonPayload, _ := json.Marshal(event)

	for _, wh := range webhooks {
		if strings.Contains(wh.Events, eventType) {
			// In production, this should be an async worker (e.g., Redis/RabbitMQ)
			go s.sendWebhook(wh.URL, jsonPayload)
		}
	}
}

func (s *SettingsService) sendWebhook(url string, payload []byte) {
	resp, err := http.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		fmt.Printf("⚠️ Webhook failed for %s: %v\n", url, err)
		return
	}
	defer resp.Body.Close()
	
	if resp.StatusCode >= 400 {
		fmt.Printf("⚠️ Webhook returned error %d for %s\n", resp.StatusCode, url)
	}
}
