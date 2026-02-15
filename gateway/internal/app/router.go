package app

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/safina57/animoji/gateway/internal/handlers"
	"github.com/safina57/animoji/gateway/internal/messaging"
	appMiddleware "github.com/safina57/animoji/gateway/internal/middleware"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// newRouter creates and configures the HTTP router
func newRouter(eventManager *messaging.EventManager, storageService *storage.MinIOService) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)

	// CORS middleware for frontend integration
	r.Use(appMiddleware.CORS)

	// Routes
	r.Get("/health", handlers.HandleHealth)
	r.Post("/submit-job", handlers.HandleSubmitJob)
	r.Get("/job-status/{job_id}/stream", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleJobStatusStream(w, r, eventManager, storageService)
	})

	return r
}
