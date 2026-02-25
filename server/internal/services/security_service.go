package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"github.com/hotpatch/server/internal/repository"
)

// SecurityService handles security-related business logic.
type SecurityService struct {
	repo *repository.SecurityRepository
}

// NewSecurityService creates a new SecurityService.
func NewSecurityService(repo *repository.SecurityRepository) *SecurityService {
	return &SecurityService{repo: repo}
}

// HashApiKey computes a SHA-256 hash of the raw API key.
// This is a one-way operation — the raw key cannot be recovered from the hash.
func HashApiKey(rawKey string) string {
	hash := sha256.Sum256([]byte(rawKey))
	return hex.EncodeToString(hash[:])
}

// ── API Keys ──────────────────────────────────────────

func (s *SecurityService) CreateApiKey(ctx context.Context, appID uuid.UUID, req *models.CreateApiKeyRequest) (*models.ApiKey, string, error) {
	// Generate raw key
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return nil, "", err
	}
	rawKey := "hp_" + hex.EncodeToString(bytes)

	// Create prefix for UI display (first 8 chars + "...")
	prefix := rawKey[:8] + "..."

	// Hash the key before storing — the raw key is only returned once
	hashedKey := HashApiKey(rawKey)

	apiKey := &models.ApiKey{
		ID:        uuid.New(),
		AppID:     appID,
		Name:      req.Name,
		Key:       hashedKey,
		Prefix:    prefix,
		ExpiresAt: req.ExpiresAt,
	}

	if err := s.repo.CreateApiKey(apiKey); err != nil {
		return nil, "", err
	}

	// Log audit trail
	s.Log(appID, "system", "security.api_key_create", apiKey.ID.String(), fmt.Sprintf("Name: %s", apiKey.Name), "")

	return apiKey, rawKey, nil // Return raw key only on creation
}

// ValidateApiKey looks up an API key by hashing the provided raw key and
// comparing it against stored hashes. Returns the matching ApiKey if found.
func (s *SecurityService) ValidateApiKey(rawKey string) (*models.ApiKey, error) {
	hashedKey := HashApiKey(rawKey)
	return s.repo.FindByKey(hashedKey)
}

func (s *SecurityService) ListApiKeys(appID uuid.UUID) ([]models.ApiKey, error) {
	return s.repo.ListApiKeys(appID)
}

func (s *SecurityService) DeleteApiKey(appID, keyID uuid.UUID) error {
	// Log audit trail
	s.Log(appID, "system", "security.api_key_delete", keyID.String(), "", "")

	return s.repo.DeleteApiKey(appID, keyID)
}

// ── Signing Keys ──────────────────────────────────────

func (s *SecurityService) CreateSigningKey(appID uuid.UUID, req *models.CreateSigningKeyRequest) (*models.SigningKey, error) {
	key := &models.SigningKey{
		ID:        uuid.New(),
		AppID:     appID,
		Name:      req.Name,
		PublicKey: req.PublicKey,
		IsActive:  true,
	}
	if err := s.repo.CreateSigningKey(key); err != nil {
		return nil, err
	}

	// Log audit trail
	s.Log(appID, "system", "security.signing_key_create", key.ID.String(), fmt.Sprintf("Name: %s", key.Name), "")

	return key, nil
}

func (s *SecurityService) ListSigningKeys(appID uuid.UUID) ([]models.SigningKey, error) {
	return s.repo.ListSigningKeys(appID)
}

func (s *SecurityService) DeleteSigningKey(appID, keyID uuid.UUID) error {
	// Log audit trail
	s.Log(appID, "system", "security.signing_key_delete", keyID.String(), "", "")

	return s.repo.DeleteSigningKey(appID, keyID)
}

// ── Audit Logs ────────────────────────────────────────

func (s *SecurityService) Log(appID uuid.UUID, actor, action, entityID, metadata, ip string) {
	auditLog := &models.AuditLog{
		ID:        uuid.New(),
		AppID:     appID,
		Actor:     actor,
		Action:    action,
		EntityID:  entityID,
		Metadata:  metadata,
		IPAddress: ip,
	}
	_ = s.repo.CreateAuditLog(auditLog)
}

func (s *SecurityService) ListAuditLogs(appID uuid.UUID) ([]models.AuditLog, error) {
	return s.repo.ListAuditLogs(appID, 50)
}
