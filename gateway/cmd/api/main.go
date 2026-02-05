package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/handlers"
	"github.com/safina57/animoji/gateway/internal/messaging"
	appMiddleware "github.com/safina57/animoji/gateway/internal/middleware"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

func main() {
	// Initialize logger
	logger.Init()

	// Initialize storage
	if _, err := storage.GetClient(); err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize storage")
	}

	// Initialize NATS
	if _, err := messaging.GetClient(); err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize NATS")
	}

	// Setup routes
	r := setupRouter()

	// Start server
	startServer(r)
}

func setupRouter() *chi.Mux {
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

	return r
}

func startServer(r *chi.Mux) {
	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = constants.DefaultPort
	}

	addr := fmt.Sprintf(":%s", port)

	logger.Info().Msgf(`
                                                 
                                                 
   ██   ██   █ █████  █▒  ▒█  ▓██▓    ███  █████ 
   ██   ██░  █   █    ██  ██ ▒█  █▒     █    █   
  ▒██▒  █▒▓  █   █    ██░░██ █░  ░█     █    █   
  ▓▒▒▓  █ █  █   █    █▒▓▓▒█ █    █     █    █   
  █░░█  █ ▓▓ █   █    █ ██ █ █    █     █    █   
  █  █  █  █ █   █    █ █▓ █ █    █     █    █   
 ▒████▒ █  ▓▒█   █    █    █ █░  ░█     █    █   
 ▓▒  ▒▓ █  ░██   █    █    █ ▒█  █▒ █░ ▒█    █   
 █░  ░█ █   ██ █████  █    █  ▓██▓  ▒███░  █████ 
                                                 `)

	logger.Info().
		Str("url", fmt.Sprintf("http://localhost%s", addr)).
		Str("port", port).
		Msg("Gateway API server starting")

	if err := http.ListenAndServe(addr, r); err != nil {
		logger.Fatal().Err(err).Msg("Server failed to start")
	}
}
