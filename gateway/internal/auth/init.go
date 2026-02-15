package auth

import (
	"crypto/rsa"
	"os"
	"strconv"
	"sync"

	"github.com/rs/zerolog/log"
	"github.com/safina57/animoji/gateway/internal/constants"
	"golang.org/x/oauth2"
)

// AuthConfig holds all authentication-related dependencies
type AuthConfig struct {
	GoogleConfig *oauth2.Config
	PrivateKey   *rsa.PrivateKey
	PublicKey    *rsa.PublicKey
	JWTExpiry    int
}

var (
	authConfigInstance *AuthConfig
	authConfigOnce     sync.Once
	authConfigError    error
)

// Init initializes all authentication components
func Init() (*AuthConfig, error) {
	authConfigOnce.Do(func() {
		// Load RSA keys
		privateKey, publicKey, err := LoadRSAKeys()
		if err != nil {
			authConfigError = err
			return
		}

		// Initialize Google OAuth configuration
		googleConfig, err := InitGoogleConfig()
		if err != nil {
			authConfigError = err
			return
		}

		// Parse JWT expiry hours (default to 24 hours / 1 days)
		jwtExpiry := constants.DefaultJWTExpiryHours
		if expiryStr := os.Getenv("JWT_EXPIRY_HOURS"); expiryStr != "" {
			if parsed, err := strconv.Atoi(expiryStr); err == nil && parsed > 0 {
				jwtExpiry = parsed
			}
		}

		authConfigInstance = &AuthConfig{
			GoogleConfig: googleConfig,
			PrivateKey:   privateKey,
			PublicKey:    publicKey,
			JWTExpiry:    jwtExpiry,
		}

		log.Info().
			Msg("Authentication system initialized successfully")
	})

	return authConfigInstance, authConfigError
}

// GetConfig returns the authentication configuration instance
func GetConfig() *AuthConfig {
	if authConfigInstance == nil {
		log.Fatal().Msg("Auth config not initialized. Call Init first.")
	}
	return authConfigInstance
}
