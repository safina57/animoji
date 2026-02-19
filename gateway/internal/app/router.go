package app

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/handlers"
	"github.com/safina57/animoji/gateway/internal/messaging"
	appMiddleware "github.com/safina57/animoji/gateway/internal/middleware"
	"github.com/safina57/animoji/gateway/internal/repository"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// newRouter creates and configures the HTTP router
func newRouter(
	eventManager *messaging.EventManager,
	storageService *storage.MinIOService,
	repo *repository.Repository,
	authConfig *auth.AuthConfig,
) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	// CORS middleware for frontend integration
	r.Use(appMiddleware.CORS)

	// Create auth handlers
	googleLogin, googleCallback, getMe, logout := handlers.NewAuthHandlers(
		authConfig.GoogleConfig,
		repo,
		authConfig.PrivateKey,
		authConfig.JWTExpiry,
	)

	// Create handlers
	publishHandler := handlers.NewPublishImageHandler(repo)
	publicImagesHandler := handlers.NewPublicImagesHandler(repo, storageService)
	likeHandler := handlers.NewLikeImageHandler(repo)

	// Public routes
	r.Get("/health", handlers.HandleHealth)
	r.Get("/auth/google/login", googleLogin)
	r.Get("/auth/google/callback", googleCallback)
	r.Post("/auth/logout", logout)

	// Image routes — optionally authenticated so is_liked_by_user is populated for logged-in users
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.OptionalAuthenticate(authConfig.PublicKey))
		r.Get("/images/public", publicImagesHandler.HandleGetPublicImages)
		r.Get("/images/{image_id}", publicImagesHandler.HandleGetImageDetail)
	})

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(appMiddleware.Authenticate(authConfig.PublicKey))

		r.Get("/auth/me", getMe)
		r.Post("/submit-job", handlers.HandleSubmitJob)
		r.Get("/job-status/{job_id}/stream", func(w http.ResponseWriter, r *http.Request) {
			handlers.HandleJobStatusStream(w, r, eventManager, storageService)
		})
		r.Post("/jobs/{job_id}/refine", handlers.HandleRefineJob)
		r.Post("/images/{job_id}/publish", publishHandler.HandlePublishImage)

		r.Post("/images/{image_id}/like", likeHandler.HandleLikeImage)
		r.Delete("/images/{image_id}/like", likeHandler.HandleUnlikeImage)
		r.Get("/images/{image_id}/liked", likeHandler.HandleCheckLiked)
	})

	return r
}
