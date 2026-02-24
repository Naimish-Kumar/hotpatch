package services

import (
	"fmt"
)

// EmailService handles sending system emails.
type EmailService struct {
	backendURL string
}

// NewEmailService creates a new EmailService.
func NewEmailService(backendURL string) *EmailService {
	return &EmailService{
		backendURL: backendURL,
	}
}

// SendVerificationEmail sends a verification link to a new user.
func (s *EmailService) SendVerificationEmail(email, token string) error {
	verificationURL := fmt.Sprintf("%s/auth/verify?token=%s", s.backendURL, token)

	// In a real app, you'd use SendGrid, AWS SES, or SMTP.
	// For this implementation, we'll log it to stdout for easy access during development.
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("📧 Email Verification Sent To: %s\n", email)
	fmt.Printf("🔗 Link: %s\n", verificationURL)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	return nil
}
