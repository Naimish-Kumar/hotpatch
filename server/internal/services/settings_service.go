package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
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
	repo            *repository.SettingsRepository
	securityService *SecurityService
}

// NewSettingsService creates a new SettingsService.
func NewSettingsService(repo *repository.SettingsRepository, securityService *SecurityService) *SettingsService {
	return &SettingsService{repo: repo, securityService: securityService}
}

// ── App Settings ──────────────────────────────────────
func (s *SettingsService) GetApp(appID uuid.UUID) (*models.App, error) {
	return s.repo.GetApp(appID)
}

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

	// Log audit trail
	s.securityService.Log(appID, "system", "app.update", appID.String(), "", "")

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

	// Log audit trail
	s.securityService.Log(appID, "system", "webhook.create", webhook.ID.String(), fmt.Sprintf("URL: %s", webhook.URL), "")

	return webhook, secret, nil
}

func (s *SettingsService) ListWebhooks(appID uuid.UUID) ([]models.Webhook, error) {
	return s.repo.ListWebhooks(appID)
}

func (s *SettingsService) DeleteWebhook(appID, webhookID uuid.UUID) error {
	// Log audit trail
	s.securityService.Log(appID, "system", "webhook.delete", webhookID.String(), "", "")

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
			go s.sendWebhook(wh.URL, wh.Secret, jsonPayload)
		}
	}
}

// sendWebhook delivers a webhook payload with HMAC-SHA256 signature for verification.
func (s *SettingsService) sendWebhook(url, secret string, payload []byte) {
	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	// Compute HMAC-SHA256 signature: HMAC(secret, timestamp + "." + payload)
	signedPayload := []byte(timestamp + "." + string(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(signedPayload)
	signature := hex.EncodeToString(mac.Sum(nil))

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		fmt.Printf("⚠️ Webhook request creation failed for %s: %v\n", url, err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-HotPatch-Signature", fmt.Sprintf("sha256=%s", signature))
	req.Header.Set("X-HotPatch-Timestamp", timestamp)
	req.Header.Set("User-Agent", "HotPatch-Webhook/1.0")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("⚠️ Webhook failed for %s: %v\n", url, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		fmt.Printf("⚠️ Webhook returned error %d for %s\n", resp.StatusCode, url)
	}
}
