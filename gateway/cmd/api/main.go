package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/internal/handlers"
	appMiddleware "github.com/safina57/animoji/gateway/internal/middleware"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

func main() {
	// Initialize logger
	logger.Init()

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
	r.Post("/generate", handlers.HandleGenerate)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = constants.DefaultPort
	}

	// Start server
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
