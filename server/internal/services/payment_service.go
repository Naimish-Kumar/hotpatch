package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hotpatch/server/internal/config"
	"github.com/hotpatch/server/internal/repository"
	"github.com/stripe/stripe-go/v76"
	portalsession "github.com/stripe/stripe-go/v76/billingportal/session"
	checkoutsession "github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/customer"
	"github.com/stripe/stripe-go/v76/subscription"
	"github.com/stripe/stripe-go/v76/webhook"
)

type PaymentService struct {
	repo            *repository.SettingsRepository
	cfg             *config.Config
	securityService *SecurityService
}

func NewPaymentService(repo *repository.SettingsRepository, cfg *config.Config, securityService *SecurityService) *PaymentService {
	stripe.Key = cfg.StripeSecretKey
	return &PaymentService{
		repo:            repo,
		cfg:             cfg,
		securityService: securityService,
	}
}

// CreateCheckoutSession starts a Stripe Checkout flow for an app.
func (s *PaymentService) CreateCheckoutSession(appID uuid.UUID, tier string) (string, error) {
	app, err := s.repo.GetApp(appID)
	if err != nil {
		return "", err
	}

	priceID := s.cfg.StripePriceIDPro
	if tier == "enterprise" {
		priceID = s.cfg.StripePriceIDEnt
	}

	// Create customer if not exists
	if app.StripeCustomerID == "" {
		params := &stripe.CustomerParams{
			Email: stripe.String("app-" + app.ID.String() + "@hotpatch.io"), // Placeholder or use owner email
			Name:  stripe.String(app.Name),
			Metadata: map[string]string{
				"app_id": app.ID.String(),
			},
		}
		cus, err := customer.New(params)
		if err != nil {
			return "", err
		}
		app.StripeCustomerID = cus.ID
		s.repo.UpdateApp(app)
	}

	params := &stripe.CheckoutSessionParams{
		Customer:   stripe.String(app.StripeCustomerID),
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL: stripe.String(s.cfg.FrontendURL + "/dashboard/billing?success=true"),
		CancelURL:  stripe.String(s.cfg.FrontendURL + "/dashboard/billing?canceled=true"),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		Metadata: map[string]string{
			"app_id": app.ID.String(),
			"tier":   tier,
		},
	}

	sess, err := checkoutsession.New(params)
	if err != nil {
		return "", err
	}

	return sess.URL, nil
}

// HandleWebhook processes Stripe events (async).
func (s *PaymentService) HandleWebhook(payload []byte, sigHeader string) error {
	event, err := webhook.ConstructEvent(payload, sigHeader, s.cfg.StripeWebhookSecret)
	if err != nil {
		return fmt.Errorf("bad signature: %w", err)
	}

	switch event.Type {
	case "checkout.session.completed":
		var sess stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &sess); err != nil {
			return err
		}
		return s.handleCheckoutCompleted(&sess)

	case "customer.subscription.deleted", "customer.subscription.updated":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
			return err
		}
		return s.handleSubscriptionChange(&sub)
	}

	return nil
}

func (s *PaymentService) handleCheckoutCompleted(sess *stripe.CheckoutSession) error {
	appIDStr := sess.Metadata["app_id"]
	tier := sess.Metadata["tier"]
	appID, _ := uuid.Parse(appIDStr)

	app, err := s.repo.GetApp(appID)
	if err != nil {
		return err
	}

	app.Tier = tier
	app.StripeSubscriptionID = sess.Subscription.ID
	app.SubscriptionStatus = "active"

	// Fetch subscription to get end date
	sub, _ := subscription.Get(app.StripeSubscriptionID, nil)
	if sub != nil {
		app.SubscriptionEnd = time.Unix(sub.CurrentPeriodEnd, 0)
	}

	if err := s.repo.UpdateApp(app); err != nil {
		return err
	}

	s.securityService.Log(appID, "stripe", "billing.subscription_started", app.StripeSubscriptionID, fmt.Sprintf("Tier: %s", tier), "")
	return nil
}

func (s *PaymentService) handleSubscriptionChange(sub *stripe.Subscription) error {
	// Find the app associated with this subscription
	app, err := s.repo.GetAppBySubscriptionID(sub.ID)
	if err != nil {
		// Subscription not tracked in our system — ignore
		return nil
	}

	switch sub.Status {
	case stripe.SubscriptionStatusCanceled, stripe.SubscriptionStatusUnpaid:
		// Downgrade to free tier
		app.Tier = "free"
		app.SubscriptionStatus = string(sub.Status)
		app.StripeSubscriptionID = ""
		if err := s.repo.UpdateApp(app); err != nil {
			return err
		}
		s.securityService.Log(app.ID, "stripe", "billing.subscription_canceled", sub.ID, fmt.Sprintf("Previous tier: %s", app.Tier), "")

	case stripe.SubscriptionStatusActive:
		// Subscription updated (e.g., plan change)
		app.SubscriptionStatus = "active"
		app.SubscriptionEnd = time.Unix(sub.CurrentPeriodEnd, 0)
		if err := s.repo.UpdateApp(app); err != nil {
			return err
		}
		s.securityService.Log(app.ID, "stripe", "billing.subscription_updated", sub.ID, "", "")

	case stripe.SubscriptionStatusPastDue:
		// Mark as past due but don't downgrade yet
		app.SubscriptionStatus = "past_due"
		if err := s.repo.UpdateApp(app); err != nil {
			return err
		}
		s.securityService.Log(app.ID, "stripe", "billing.subscription_past_due", sub.ID, "", "")
	}

	return nil
}

// CreatePortalSession allows users to manage their billing in Stripe Dashboard.
func (s *PaymentService) CreatePortalSession(appID uuid.UUID) (string, error) {
	app, err := s.repo.GetApp(appID)
	if err != nil {
		return "", err
	}

	if app.StripeCustomerID == "" {
		return "", fmt.Errorf("no stripe customer found for this app")
	}

	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(app.StripeCustomerID),
		ReturnURL: stripe.String(s.cfg.FrontendURL + "/dashboard/billing"),
	}

	sess, err := portalsession.New(params)
	if err != nil {
		return "", err
	}

	return sess.URL, nil
}
