package app

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

// Server handles HTTP server lifecycle
type Server struct {
	httpServer *http.Server
	handler    http.Handler
}

// NewServer creates a new Server with the provided HTTP handler
func NewServer(handler http.Handler) *Server {
	return &Server{
		handler: handler,
	}
}

// Start begins listening on the configured port and blocks until shutdown
func (s *Server) Start() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = constants.DefaultPort
	}

	addr := fmt.Sprintf(":%s", port)

	s.httpServer = &http.Server{
		Addr:         addr,
		Handler:      s.handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	logBanner()

	logger.Info().
		Str("url", fmt.Sprintf("http://localhost%s", addr)).
		Str("port", port).
		Msg("Gateway API server starting")

	// Start server in goroutine
	go func() {
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal().Err(err).Msg("Server failed to start")
		}
	}()

	// Wait for shutdown signal
	s.waitForShutdown()
	return nil
}

// waitForShutdown waits for an interrupt signal and gracefully shuts down
func (s *Server) waitForShutdown() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	logger.Info().Msg("Shutdown signal received, gracefully stopping server")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := s.httpServer.Shutdown(ctx); err != nil {
		logger.Error().Err(err).Msg("Server forced to shutdown")
	}

	logger.Info().Msg("Server stopped")
}

func logBanner() {
	logger.Info().Msgf(`
                                                 
                                                 
   ██   ██   █ █████  █▒  ▒█  ▓██▓    ███  █████ 
   ██   ██░  █   █    ██  ██ ▒█  █▒     █    █   
  ▒██▒  █▒▓  █   █    ██░░██ █░  ░█     █    █   
  ▓▒▒▓  █ █  █   █    █▒▓▓▒█ █    █     █    █   
  █░░█  █ ▓▓ █   █    █ ██ █ █    █     █    █   
  █  █  █  █ █   █    █ █▓ █ █    █     █    █   
 ▒████▒ █  ▓▓█   █    █    █ █░  ░█     █    █   
 ▓▒  ▒▓ █  ░██   █    █    █ ▒█  █▒ █░ ▒█    █   
 █░  ░█ █   ██ █████  █    █  ▓██▓  ▒███░  █████ 
                                                 `)
}
