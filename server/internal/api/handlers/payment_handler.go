package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/services"
)

type PaymentHandler struct {
	service *services.PaymentService
}

func NewPaymentHandler(service *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{service: service}
}

// CreateCheckoutSession handles POST /billing/checkout.
func (h *PaymentHandler) CreateCheckoutSession(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	var req struct {
		Tier string `json:"tier" binding:"required,oneof=pro enterprise"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	url, err := h.service.CreateCheckoutSession(appID, req.Tier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// CreatePortalSession handles POST /billing/portal.
func (h *PaymentHandler) CreatePortalSession(c *gin.Context) {
	appIDStr, _ := c.Get("app_id")
	appID, _ := uuid.Parse(appIDStr.(string))

	url, err := h.service.CreatePortalSession(appID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// HandleWebhook handles POST /billing/webhook (unauthenticated, sig verified by SDK).
func (h *PaymentHandler) HandleWebhook(c *gin.Context) {
	sig := c.GetHeader("Stripe-Signature")
	if sig == "" {
		c.Status(http.StatusBadRequest)
		return
	}

	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	if err := h.service.HandleWebhook(payload, sig); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}
