package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
	internalAuth "github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/handlers"
	authSvc "github.com/safina57/animoji/gateway/internal/services/auth"
	"golang.org/x/oauth2"
)

// stateStore manages OAuth state parameters with expiry for CSRF protection.
type stateStore struct {
	mu     sync.RWMutex
	states map[string]time.Time
}

func newStateStore() *stateStore {
	store := &stateStore{
		states: make(map[string]time.Time),
	}
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			store.cleanup()
		}
	}()
	return store
}

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

func (s *stateStore) validate(state string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	expiry, exists := s.states[state]
	if !exists {
		return false
	}
	delete(s.states, state)
	return time.Now().Before(expiry)
}

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

// AuthHandler holds dependencies for auth HTTP endpoints.
type AuthHandler struct {
	svc          *authSvc.AuthService
	googleConfig *oauth2.Config
	stateStore   *stateStore
	jwtExpiry    int
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(svc *authSvc.AuthService, googleConfig *oauth2.Config, jwtExpiry int) *AuthHandler {
	return &AuthHandler{
		svc:          svc,
		googleConfig: googleConfig,
		stateStore:   newStateStore(),
		jwtExpiry:    jwtExpiry,
	}
}

// HandleGoogleLogin redirects the user to Google's OAuth consent screen.
func (h *AuthHandler) HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	state, err := h.stateStore.generate()
	if err != nil {
		log.Error().Err(err).Msg("Failed to generate OAuth state")
		handlers.RespondError(w, "internal server error", http.StatusInternalServerError)
		return
	}
	authURL := h.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// HandleGoogleCallback processes the OAuth callback and issues a JWT cookie.
func (h *AuthHandler) HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	if !h.stateStore.validate(state) {
		log.Warn().Str("state", state).Msg("Invalid or expired OAuth state")
		handlers.RespondError(w, "invalid state parameter", http.StatusBadRequest)
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		log.Warn().Msg("Missing authorization code in OAuth callback")
		handlers.RespondError(w, "missing authorization code", http.StatusBadRequest)
		return
	}

	token, err := h.googleConfig.Exchange(r.Context(), code)
	if err != nil {
		log.Error().Err(err).Msg("Failed to exchange authorization code")
		handlers.RespondError(w, "failed to exchange code", http.StatusInternalServerError)
		return
	}

	userInfo, err := internalAuth.FetchGoogleUserInfo(r.Context(), h.googleConfig, token)
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch user info from Google")
		handlers.RespondError(w, "failed to fetch user info", http.StatusInternalServerError)
		return
	}

	jwtToken, err := h.svc.UpsertGoogleUser(r.Context(), userInfo.ID, userInfo.Email, userInfo.Name, &userInfo.Picture)
	if err != nil {
		log.Error().Err(err).Msg("Failed to upsert user and generate JWT")
		handlers.RespondError(w, "failed to create user", http.StatusInternalServerError)
		return
	}

	log.Info().
		Str("email", userInfo.Email).
		Msg("User authenticated via Google OAuth")

	maxAge := h.jwtExpiry * 60 * 60
	http.SetCookie(w, &http.Cookie{
		Name:     constants.CookieNameAuthToken,
		Value:    jwtToken,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: http.SameSiteLaxMode,
	})

	frontendURL := os.Getenv("FRONTEND_URL")
	http.Redirect(w, r, fmt.Sprintf("%s/auth/callback", frontendURL), http.StatusTemporaryRedirect)
}

// HandleGetMe returns the current authenticated user's profile.
func (h *AuthHandler) HandleGetMe(w http.ResponseWriter, r *http.Request) {
	claims, err := internalAuth.GetUserFromContext(r.Context())
	if err != nil {
		handlers.RespondError(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	response, err := h.svc.GetMe(r.Context(), claims.UserID)
	if err != nil {
		log.Error().Err(err).Str("user_id", claims.UserID.String()).Msg("Failed to fetch user")
		handlers.RespondError(w, "user not found", http.StatusNotFound)
		return
	}

	handlers.RespondJSON(w, response, http.StatusOK)
}

// HandleLogout clears the authentication cookie.
func (h *AuthHandler) HandleLogout(w http.ResponseWriter, r *http.Request) {
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

	handlers.RespondJSON(w, map[string]string{"message": "logged out successfully"}, http.StatusOK)
}
