package handlers

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/dto"
	"github.com/safina57/animoji/gateway/internal/repository"
	"golang.org/x/oauth2"
)

// stateStore manages OAuth state parameters with expiry for CSRF protection
type stateStore struct {
	mu     sync.RWMutex
	states map[string]time.Time // state -> expiry time
}

// newStateStore creates a new state store and starts cleanup goroutine
func newStateStore() *stateStore {
	store := &stateStore{
		states: make(map[string]time.Time),
	}

	// Cleanup expired states every minute
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			store.cleanup()
		}
	}()

	return store
}

// generate creates a new random state with 5-minute expiry
func (s *stateStore) generate() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random state: %w", err)
	}

	state := hex.EncodeToString(bytes)
	expiry := time.Now().Add(constants.StateExpiryMinutes * time.Minute)

	s.mu.Lock()
	s.states[state] = expiry
	s.mu.Unlock()

	return state, nil
}

// validate checks if state exists and is not expired, then removes it (single-use)
func (s *stateStore) validate(state string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	expiry, exists := s.states[state]
	if !exists {
		return false
	}

	// Remove state (single-use)
	delete(s.states, state)

	// Check if expired
	return time.Now().Before(expiry)
}

// cleanup removes expired states
func (s *stateStore) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for state, expiry := range s.states {
		if now.After(expiry) {
			delete(s.states, state)
		}
	}
}

// AuthHandlers holds dependencies for auth handlers
type AuthHandlers struct {
	googleConfig *oauth2.Config
	repo         *repository.Repository
	privateKey   *rsa.PrivateKey
	jwtExpiry    int
	stateStore   *stateStore
}

// NewAuthHandlers creates auth handler functions with dependencies injected
func NewAuthHandlers(
	googleConfig *oauth2.Config,
	repo *repository.Repository,
	privateKey *rsa.PrivateKey,
	jwtExpiry int,
) (http.HandlerFunc, http.HandlerFunc, http.HandlerFunc, http.HandlerFunc) {
	h := &AuthHandlers{
		googleConfig: googleConfig,
		repo:         repo,
		privateKey:   privateKey,
		jwtExpiry:    jwtExpiry,
		stateStore:   newStateStore(),
	}

	return h.handleGoogleLogin, h.handleGoogleCallback, h.handleGetMe, h.handleLogout
}

// handleGoogleLogin redirects user to Google OAuth consent screen
func (h *AuthHandlers) handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	// Generate CSRF state
	state, err := h.stateStore.generate()
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate OAuth state")
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}

	// Get Google OAuth URL
	authURL := h.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)

	// Redirect to Google
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// handleGoogleCallback processes OAuth callback and issues JWT
func (h *AuthHandlers) handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	// Validate state (CSRF protection)
	state := r.URL.Query().Get("state")
	if !h.stateStore.validate(state) {
		log.Warn().Str("state", state).Msg("Invalid or expired OAuth state")
		http.Error(w, `{"error":"invalid state parameter"}`, http.StatusBadRequest)
		return
	}

	// Get authorization code
	code := r.URL.Query().Get("code")
	if code == "" {
		log.Warn().Msg("Missing authorization code in OAuth callback")
		http.Error(w, `{"error":"missing authorization code"}`, http.StatusBadRequest)
		return
	}

	// Exchange code for access token
	token, err := h.googleConfig.Exchange(r.Context(), code)
	if err != nil {
		log.Error().Err(err).Msg("Failed to exchange authorization code")
		http.Error(w, `{"error":"failed to exchange code"}`, http.StatusInternalServerError)
		return
	}

	// Fetch user info from Google
	userInfo, err := auth.FetchGoogleUserInfo(r.Context(), h.googleConfig, token)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch user info from Google")
		http.Error(w, `{"error":"failed to fetch user info"}`, http.StatusInternalServerError)
		return
	}

	// Upsert user in database
	user, err := h.repo.CreateOrUpdateUser(r.Context(), userInfo.ID, userInfo.Email, userInfo.Name, &userInfo.Picture)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create or update user")
		http.Error(w, `{"error":"failed to create user"}`, http.StatusInternalServerError)
		return
	}

	// Generate JWT
	jwtToken, err := auth.GenerateJWT(user.ID, user.Email, user.Name, h.privateKey, h.jwtExpiry)
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate JWT")
		http.Error(w, `{"error":"failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	log.Info().
		Str("user_id", user.ID.String()).
		Str("email", user.Email).
		Msg("User authenticated via Google OAuth")

	// Set JWT as HTTP-only cookie
	maxAge := h.jwtExpiry * 60 * 60 // Convert hours to seconds
	http.SetCookie(w, &http.Cookie{
		Name:     constants.CookieNameAuthToken,
		Value:    jwtToken,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,                      // Prevents JavaScript access (XSS protection)
		Secure:   os.Getenv("ENV") == "production", // HTTPS only in production
		SameSite: http.SameSiteLaxMode,     // CSRF protection
	})

	// Get frontend URL from environment
	frontendURL := os.Getenv("FRONTEND_URL")

	// Redirect to frontend without token in URL
	callbackURL := fmt.Sprintf("%s/auth/callback", frontendURL)
	http.Redirect(w, r, callbackURL, http.StatusTemporaryRedirect)
}

// handleGetMe returns the current authenticated user's profile
func (h *AuthHandlers) handleGetMe(w http.ResponseWriter, r *http.Request) {
	// Extract user claims from context (injected by auth middleware)
	claims, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Fetch fresh user data from database
	user, err := h.repo.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		log.Error().Err(err).Str("user_id", claims.UserID.String()).Msg("Failed to fetch user from database")
		http.Error(w, `{"error":"user not found"}`, http.StatusNotFound)
		return
	}

	// Build response
	response := dto.GetMeResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		AvatarURL: user.AvatarURL,
		CreatedAt: user.CreatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Error().Err(err).Msg("Failed to encode response")
		http.Error(w, `{"error":"internal server error"}`, http.StatusInternalServerError)
		return
	}
}

// handleLogout clears the authentication cookie
func (h *AuthHandlers) handleLogout(w http.ResponseWriter, r *http.Request) {
	// Clear the auth cookie by setting MaxAge to -1
	http.SetCookie(w, &http.Cookie{
		Name:     constants.CookieNameAuthToken,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: http.SameSiteLaxMode,
	})

	log.Info().Msg("User logged out")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "logged out successfully"})
}
