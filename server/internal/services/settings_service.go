package services

import (
	"bytes"
	"context"
	"crypto/hmac"
	crand "crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
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
	crand.Read(secretBytes)
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
			go s.sendWebhookWithRetry(wh.URL, wh.Secret, jsonPayload, event.ID)
		}
	}
}

// webhookMaxRetries is the maximum number of delivery attempts per webhook.
const webhookMaxRetries = 5

// sendWebhookWithRetry delivers a webhook payload with exponential backoff retry.
// It attempts delivery up to webhookMaxRetries times with delays of 1s, 2s, 4s, 8s, 16s.
// Each attempt re-signs the payload with a fresh timestamp.
func (s *SettingsService) sendWebhookWithRetry(url, secret string, payload []byte, eventID string) {
	var lastErr error

	for attempt := 0; attempt < webhookMaxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff: 1s, 2s, 4s, 8s, 16s
			baseDelay := time.Duration(1<<uint(attempt-1)) * time.Second

			// Add jitter (±25%) to prevent thundering herd
			jitter := time.Duration(rand.Int63n(int64(baseDelay) / 2))
			delay := baseDelay + jitter

			log.Printf("[Webhook] Event %s → %s: retry %d/%d in %v", eventID, url, attempt, webhookMaxRetries, delay)
			time.Sleep(delay)
		}

		lastErr = s.sendWebhook(url, secret, payload)
		if lastErr == nil {
			if attempt > 0 {
				log.Printf("[Webhook] Event %s → %s: delivered on attempt %d", eventID, url, attempt+1)
			}
			return
		}
	}

	log.Printf("[Webhook] Event %s → %s: FAILED after %d attempts. Last error: %v",
		eventID, url, webhookMaxRetries, lastErr)
}

// sendWebhook delivers a webhook payload with HMAC-SHA256 signature for verification.
// Returns nil on success (2xx/3xx), or an error for network failures and 4xx/5xx responses.
func (s *SettingsService) sendWebhook(url, secret string, payload []byte) error {
	timestamp := fmt.Sprintf("%d", time.Now().Unix())

	// Compute HMAC-SHA256 signature: HMAC(secret, timestamp + "." + payload)
	signedPayload := []byte(timestamp + "." + string(payload))
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(signedPayload)
	signature := hex.EncodeToString(mac.Sum(nil))

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("request creation failed: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-HotPatch-Signature", fmt.Sprintf("sha256=%s", signature))
	req.Header.Set("X-HotPatch-Timestamp", timestamp)
	req.Header.Set("X-HotPatch-Delivery", fmt.Sprintf("%d", time.Now().UnixNano()))
	req.Header.Set("User-Agent", "HotPatch-Webhook/1.0")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("delivery failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	return nil
}
