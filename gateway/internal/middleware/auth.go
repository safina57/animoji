package middleware

import (
	"crypto/rsa"
	"net/http"
	"strings"

	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/constants"
)

// OptionalAuthenticate tries to extract and validate a JWT but never rejects the request.
// If a valid token is found, user claims are injected into the context for downstream handlers.
func OptionalAuthenticate(publicKey *rsa.PublicKey) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenString string

			if cookie, err := r.Cookie(constants.CookieNameAuthToken); err == nil {
				tokenString = cookie.Value
			} else if header := r.Header.Get("Authorization"); header != "" {
				parts := strings.SplitN(header, " ", 2)
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenString = parts[1]
				}
			}

			if tokenString != "" {
				if claims, err := auth.ValidateJWT(tokenString, publicKey); err == nil {
					r = r.WithContext(auth.InjectUserIntoContext(r.Context(), claims))
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// Authenticate is a middleware that validates JWT tokens and injects user claims into context
func Authenticate(publicKey *rsa.PublicKey) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenString string

			// Try to get token from cookie first
			cookie, err := r.Cookie(constants.CookieNameAuthToken)
			if err == nil {
				tokenString = cookie.Value
			} else {
				// Fallback to Authorization header (for API clients)
				authHeader := r.Header.Get("Authorization")
				if authHeader == "" {
					http.Error(w, `{"error":"missing authentication"}`, http.StatusUnauthorized)
					return
				}

				// Check Bearer token format
				parts := strings.Split(authHeader, " ")
				if len(parts) != 2 || parts[0] != "Bearer" {
					http.Error(w, `{"error":"invalid authorization header format"}`, http.StatusUnauthorized)
					return
				}

				tokenString = parts[1]
			}

			// Validate JWT
			claims, err := auth.ValidateJWT(tokenString, publicKey)
			if err != nil {
				http.Error(w, `{"error":"invalid token"}`, http.StatusUnauthorized)
				return
			}

			// Inject user claims into context
			ctx := auth.InjectUserIntoContext(r.Context(), claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
