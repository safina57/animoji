package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"

	"github.com/rs/zerolog/log"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// GoogleUserInfo represents user information from Google API
type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

var (
	googleConfigInstance *oauth2.Config
	googleConfigOnce     sync.Once
	googleConfigError    error
)

// InitGoogleConfig initializes the Google OAuth2 configuration
func InitGoogleConfig() (*oauth2.Config, error) {
	googleConfigOnce.Do(func() {
		clientID := os.Getenv("GOOGLE_CLIENT_ID")
		if clientID == "" {
			googleConfigError = fmt.Errorf("GOOGLE_CLIENT_ID environment variable is not set")
			return
		}

		clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
		if clientSecret == "" {
			googleConfigError = fmt.Errorf("GOOGLE_CLIENT_SECRET environment variable is not set")
			return
		}

		redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
		if redirectURL == "" {
			googleConfigError = fmt.Errorf("GOOGLE_REDIRECT_URL environment variable is not set")
			return
		}

		googleConfigInstance = &oauth2.Config{
			ClientID:     clientID,
			ClientSecret: clientSecret,
			RedirectURL:  redirectURL,
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		}

		log.Info().Msg("Google OAuth config initialized successfully")
	})

	return googleConfigInstance, googleConfigError
}

// FetchGoogleUserInfo retrieves user information from Google using an access token
func FetchGoogleUserInfo(ctx context.Context, config *oauth2.Config, token *oauth2.Token) (*GoogleUserInfo, error) {
	client := config.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user info: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("google API returned status %d: %s", resp.StatusCode, string(body))
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode user info: %w", err)
	}

	return &userInfo, nil
}
