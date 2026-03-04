package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/cache"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

type rateLimitExceededResponse struct {
	Error   string `json:"error"`
	Limit   int    `json:"limit"`
	ResetAt string `json:"reset_at"`
}

// DailyRateLimit returns a chi middleware that enforces a per-user daily limit.
// prefix is the Redis key namespace ("image" or "emoji").
// limit is the max allowed requests per UTC day.
//
// Reads user identity from context (requires Authenticate middleware upstream).
// On Redis failure: fails open (logs error, passes request through).
// On limit exceeded: returns HTTP 429 with JSON body.
func DailyRateLimit(redisClient *cache.RedisClient, prefix string, limit int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, err := auth.GetUserFromContext(r.Context())
			if err != nil {
				// No authenticated user in context — let auth middleware handle it
				next.ServeHTTP(w, r)
				return
			}

			count, err := redisClient.IncrDailyCounter(r.Context(), prefix, claims.UserID)
			if err != nil {
				logger.Warn().Err(err).
					Str("prefix", prefix).
					Str("user_id", claims.UserID.String()).
					Msg("Rate limit Redis error — failing open")
				next.ServeHTTP(w, r)
				return
			}

			remaining := max(0, limit-int(count))

			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

			if int(count) > limit {
				now := time.Now().UTC()
				tomorrow := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, time.UTC)

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				if err := json.NewEncoder(w).Encode(rateLimitExceededResponse{
					Error:   "daily limit reached",
					Limit:   limit,
					ResetAt: tomorrow.Format(time.RFC3339),
				}); err != nil {
					logger.Warn().Err(err).Msg("Failed to write rate limit response body")
				}
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
