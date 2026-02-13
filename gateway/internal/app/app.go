package app

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
)

// App holds all dependencies and configuration for the application
type App struct {
	router         *chi.Mux
	natsClient     *messaging.NatsClient
	eventManager   *messaging.EventManager
	storageService *storage.MinIOService
	natsSubscriber *messaging.NatsSubscriber
}

// New initializes and returns a configured App instance
func New(ctx context.Context) (*App, error) {
	// Initialize storage
	if _, err := storage.GetClient(); err != nil {
		return nil, err
	}

	// Initialize NATS
	natsClient, err := messaging.GetClient()
	if err != nil {
		return nil, err
	}

	// Create event manager and storage service
	eventManager := messaging.NewEventManager()
	storageService := storage.NewMinIOService()

	// Create NATS subscriber and pass dependencies
	natsSubscriber := messaging.NewNatsSubscriber(natsClient, eventManager)

	return &App{
		natsClient:     natsClient,
		eventManager:   eventManager,
		storageService: storageService,
		natsSubscriber: natsSubscriber,
	}, nil
}

// Start begins all background services and returns the HTTP handler
func (a *App) Start(ctx context.Context) http.Handler {
	// Start NATS subscriber in background
	go func() {
		if err := a.natsSubscriber.SubscribeToStatusEvents(ctx); err != nil {
			logger.Error().Err(err).Msg("NATS subscriber stopped")
		}
	}()

	// Setup and return router
	a.router = newRouter(a.eventManager, a.storageService)
	return a.router
}

// Handler returns the HTTP handler for the application
func (a *App) Handler() http.Handler {
	if a.router == nil {
		return nil
	}
	return a.router
}

// Close gracefully shuts down the application
func (a *App) Close(ctx context.Context) error {
	if a.natsClient != nil {
		a.natsClient.Close()
	}
	return nil
}
