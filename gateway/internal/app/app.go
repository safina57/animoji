package app

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/internal/repository"
	"github.com/safina57/animoji/gateway/pkg/database"
	"github.com/safina57/animoji/gateway/pkg/logger"
	"github.com/safina57/animoji/gateway/pkg/storage"
	"gorm.io/gorm"
)

// App holds all dependencies and configuration for the application
type App struct {
	router         *chi.Mux
	db             *gorm.DB
	repo           *repository.Repository
	natsClient     *messaging.NatsClient
	eventManager   *messaging.EventManager
	storageService *storage.MinIOService
	natsSubscriber *messaging.NatsSubscriber
	authConfig     *auth.AuthConfig
}

// New initializes and returns a configured App instance
func New(ctx context.Context) (*App, error) {
	// Pass all models that need to be migrated
	db, err := database.Init(
		&models.User{},
		&models.Image{},
		&models.Like{},
		&models.Collection{},
		&models.CollectionItem{},
		&models.ShareLink{},
	)
	if err != nil {
		return nil, err
	}

	// Create repository for database operations
	repo := repository.NewRepository(db)

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

	// Initialize authentication system
	authConfig, err := auth.Init()
	if err != nil {
		return nil, err
	}

	return &App{
		db:             db,
		repo:           repo,
		natsClient:     natsClient,
		eventManager:   eventManager,
		storageService: storageService,
		natsSubscriber: natsSubscriber,
		authConfig:     authConfig,
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
	a.router = newRouter(
		a.eventManager,
		a.storageService,
		a.repo,
		a.authConfig,
	)
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
	// Close NATS connection
	if a.natsClient != nil {
		a.natsClient.Close()
	}

	// Close database connection pool
	if err := database.Close(); err != nil {
		logger.Error().Err(err).Msg("Failed to close database connection")
		return err
	}

	return nil
}
