package main

import (
	"context"

	"github.com/safina57/animoji/gateway/internal/app"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

func main() {
	// Initialize logger
	logger.Init()

	// Initialize application
	application, err := app.New(context.Background())
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to initialize application")
	}
	defer func() {
		if err := application.Close(context.Background()); err != nil {
			logger.Error().Err(err).Msg("Error closing application")
		}
	}()

	// Start the app
	application.Start(context.Background())

	// Create and start server
	server := app.NewServer(application.Handler())
	if err := server.Start(); err != nil {
		logger.Fatal().Err(err).Msg("Server error")
	}
}
