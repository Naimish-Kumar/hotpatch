package repository

import (
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/models"
	"gorm.io/gorm"
)

// SecurityRepository handles operations for API keys, signing keys, and audit logs.
type SecurityRepository struct {
	db *gorm.DB
}

// NewSecurityRepository creates a new SecurityRepository.
func NewSecurityRepository(db *gorm.DB) *SecurityRepository {
	return &SecurityRepository{db: db}
}

// ── API Keys ──────────────────────────────────────────

func (r *SecurityRepository) CreateApiKey(key *models.ApiKey) error {
	return r.db.Create(key).Error
}

func (r *SecurityRepository) ListApiKeys(appID uuid.UUID) ([]models.ApiKey, error) {
	var keys []models.ApiKey
	err := r.db.Where("app_id = ?", appID).Order("created_at DESC").Find(&keys).Error
	return keys, err
}

func (r *SecurityRepository) DeleteApiKey(appID uuid.UUID, keyID uuid.UUID) error {
	return r.db.Delete(&models.ApiKey{}, "app_id = ? AND id = ?", appID, keyID).Error
}

func (r *SecurityRepository) FindByKey(key string) (*models.ApiKey, error) {
	var apiKey models.ApiKey
	err := r.db.Where("key = ?", key).First(&apiKey).Error
	if err != nil {
		return nil, err
	}
	return &apiKey, nil
}

// ── Signing Keys ──────────────────────────────────────

func (r *SecurityRepository) CreateSigningKey(key *models.SigningKey) error {
	return r.db.Create(key).Error
}

func (r *SecurityRepository) ListSigningKeys(appID uuid.UUID) ([]models.SigningKey, error) {
	var keys []models.SigningKey
	err := r.db.Where("app_id = ?", appID).Order("created_at DESC").Find(&keys).Error
	return keys, err
}

func (r *SecurityRepository) DeleteSigningKey(appID uuid.UUID, keyID uuid.UUID) error {
	return r.db.Delete(&models.SigningKey{}, "app_id = ? AND id = ?", appID, keyID).Error
}

// ── Audit Logs ────────────────────────────────────────

func (r *SecurityRepository) CreateAuditLog(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *SecurityRepository) ListAuditLogs(appID uuid.UUID, limit int) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Where("app_id = ?", appID).Order("created_at DESC").Limit(limit).Find(&logs).Error
	return logs, err
}
