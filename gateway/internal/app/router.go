package app

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	internalAuth "github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/cache"
	authHandlers "github.com/safina57/animoji/gateway/internal/handlers/auth"
	emojiHandlers "github.com/safina57/animoji/gateway/internal/handlers/emojis"
	imageHandlers "github.com/safina57/animoji/gateway/internal/handlers/images"
	"github.com/safina57/animoji/gateway/internal/jobs"
	"github.com/safina57/animoji/gateway/internal/messaging"
	appMiddleware "github.com/safina57/animoji/gateway/internal/middleware"
	authSvc "github.com/safina57/animoji/gateway/internal/services/auth"
	emojiSvc "github.com/safina57/animoji/gateway/internal/services/emojis"
	imageSvc "github.com/safina57/animoji/gateway/internal/services/images"
	internalStorage "github.com/safina57/animoji/gateway/internal/services/storage"
)

// newRouter creates and configures the HTTP router with domain-grouped handlers.
func newRouter(
	imageEventManager *messaging.EventManager[jobs.ImageStatusEvent],
	emojiEventManager *messaging.EventManager[jobs.EmojiPartialEvent],
	storageService *internalStorage.MinIOService,
	imageSvc *imageSvc.ImageService,
	emojiSvc *emojiSvc.EmojiService,
	authSvc *authSvc.AuthService,
	authConfig *internalAuth.AuthConfig,
	redisClient *cache.RedisClient,
) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(appMiddleware.CORS)

	// Construct domain handlers
	authH := authHandlers.NewAuthHandler(authSvc, authConfig.GoogleConfig, authConfig.JWTExpiry)
	imgH := imageHandlers.NewImageHandler(imageSvc, redisClient)
	emojiH := emojiHandlers.NewEmojiHandler(emojiSvc, redisClient)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"healthy"}`))
	})

	// Auth routes (public)
	r.Get("/auth/google/login", authH.HandleGoogleLogin)
	r.Get("/auth/google/callback", authH.HandleGoogleCallback)
	r.Post("/auth/logout", authH.HandleLogout)

	// Image routes — optionally authenticated
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.OptionalAuthenticate(authConfig.PublicKey))
		r.Get("/images/public", imgH.HandleGetPublicImages)
		r.Get("/images/{image_id}", imgH.HandleGetImageDetail)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.Authenticate(authConfig.PublicKey))

		// Auth
		r.Get("/auth/me", authH.HandleGetMe)

		// Image job lifecycle
		r.Post("/images/jobs", imgH.HandleSubmitJob)
		r.Get("/images/jobs/{job_id}/stream", imgH.HandleJobStatusStream(imageEventManager, storageService))
		r.Post("/images/jobs/{job_id}/refine", imgH.HandleRefineJob)
		r.Post("/images/jobs/{job_id}/publish", imgH.HandlePublishImage)

		// User image gallery
		r.Get("/images/me", imgH.HandleGetMyImages)

		// Image social
		r.Post("/images/{image_id}/like", imgH.HandleLikeImage)
		r.Delete("/images/{image_id}/like", imgH.HandleUnlikeImage)
		r.Get("/images/{image_id}/liked", imgH.HandleCheckLiked)

		// Emoji job lifecycle
		r.Post("/emojis/jobs", emojiH.HandleSubmitEmojiJob)
		r.Get("/emojis/jobs/{job_id}/stream", emojiH.HandleEmojiStatusStream(emojiEventManager, storageService))
		r.Post("/emojis/jobs/{job_id}/variants/{variant_id}/publish", emojiH.HandlePublishEmojiVariant)

		// User emoji gallery
		r.Get("/emojis/me", emojiH.HandleGetMyEmojiPacks)
	})

	return r
}
