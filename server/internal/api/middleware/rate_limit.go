package middleware

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiter implements a per-device rate limiter.
// Supports both in-memory and Redis-backed storage.
type RateLimiter struct {
	mu          sync.RWMutex
	visitors    map[string]*visitor
	redisClient *redis.Client
	limit       int           // max requests per window
	window      time.Duration // time window
}

type visitor struct {
	count   int
	resetAt time.Time
}

// NewRateLimiter creates a rate limiter with the given limit and window.
func NewRateLimiter(limit int, window time.Duration, redisClient *redis.Client) *RateLimiter {
	rl := &RateLimiter{
		visitors:    make(map[string]*visitor),
		redisClient: redisClient,
		limit:       limit,
		window:      window,
	}

	if redisClient == nil {
		// Clean up stale entries every minute (only for in-memory)
		go func() {
			for {
				time.Sleep(1 * time.Minute)
				rl.cleanup()
			}
		}()
	}

	return rl
}

func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()
	now := time.Now()
	for key, v := range rl.visitors {
		if now.After(v.resetAt) {
			delete(rl.visitors, key)
		}
	}
}

func (rl *RateLimiter) allow(key string) bool {
	if rl.redisClient != nil {
		ctx := context.Background()
		redisKey := fmt.Sprintf("rl:%s", key)

		pipe := rl.redisClient.Pipeline()
		incr := pipe.Incr(ctx, redisKey)
		pipe.Expire(ctx, redisKey, rl.window)

		_, err := pipe.Exec(ctx)
		if err != nil {
			return true // Fail open in case of Redis error
		}

		return incr.Val() <= int64(rl.limit)
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	v, exists := rl.visitors[key]

	if !exists || now.After(v.resetAt) {
		rl.visitors[key] = &visitor{
			count:   1,
			resetAt: now.Add(rl.window),
		}
		return true
	}

	if v.count >= rl.limit {
		return false
	}

	v.count++
	return true
}

// RateLimitMiddleware creates a Gin middleware that rate-limits by client IP.
func RateLimitMiddleware(limit int, window time.Duration, redisClient *redis.Client) gin.HandlerFunc {
	limiter := NewRateLimiter(limit, window, redisClient)

	return func(c *gin.Context) {
		key := c.ClientIP()

		if !limiter.allow(key) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Try again later.",
			})
			return
		}

		c.Next()
	}
}
