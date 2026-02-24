package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRateLimitMiddleware_InMemory(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Limit to 2 requests per second
	r.Use(RateLimitMiddleware(2, 1*time.Second, nil))
	r.GET("/test", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	// First 2 requests should succeed
	for i := 0; i < 2; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/test", nil)
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("Request %d: expected OK, got %d", i+1, w.Code)
		}
	}

	// 3rd request should fail
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusTooManyRequests {
		t.Errorf("Expected 429 Too Many Requests, got %d", w.Code)
	}

	// Wait for window to reset
	time.Sleep(1100 * time.Millisecond)

	// Should succeed again
	w = httptest.NewRecorder()
	req, _ = http.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Errorf("Expected OK after reset, got %d", w.Code)
	}
}
