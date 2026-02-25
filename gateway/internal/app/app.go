package app

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/safina57/animoji/gateway/internal/auth"
	"github.com/safina57/animoji/gateway/internal/cache"
	"github.com/safina57/animoji/gateway/internal/jobs"
	"github.com/safina57/animoji/gateway/internal/messaging"
	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/internal/repository"
	authSvc "github.com/safina57/animoji/gateway/internal/services/auth"
	emojiSvc "github.com/safina57/animoji/gateway/internal/services/emojis"
	imageSvc "github.com/safina57/animoji/gateway/internal/services/images"
	internalStorage "github.com/safina57/animoji/gateway/internal/services/storage"
	"github.com/safina57/animoji/gateway/pkg/database"
	"github.com/safina57/animoji/gateway/pkg/logger"
	pkgstorage "github.com/safina57/animoji/gateway/pkg/storage"
	"gorm.io/gorm"
)

// App holds all dependencies and configuration for the application.
type App struct {
	router            *chi.Mux
	db                *gorm.DB
	repo              *repository.Repository
	natsClient        *messaging.NatsClient
	imageEventManager *messaging.EventManager[jobs.ImageStatusEvent]
	emojiEventManager *messaging.EventManager[jobs.EmojiPartialEvent]
	storageService    *internalStorage.MinIOService
	natsSubscriber    *messaging.NatsSubscriber
	authConfig        *auth.AuthConfig
	imageSvc          *imageSvc.ImageService
	emojiSvc          *emojiSvc.EmojiService
	authSvc           *authSvc.AuthService
	redisClient       *cache.RedisClient
}

// New initializes and returns a configured App instance.
func New(ctx context.Context) (*App, error) {
	db, err := database.Init(
		&models.User{},
		&models.Image{},
		&models.Like{},
		&models.Collection{},
		&models.CollectionItem{},
		&models.ShareLink{},
		&models.EmojiPack{},
		&models.EmojiVariant{},
	)
	if err != nil {
		return nil, err
	}

	repo := repository.NewRepository(db)

	storageClient, err := pkgstorage.GetClient()
	if err != nil {
		return nil, err
	}

	natsClient, err := messaging.GetClient()
	if err != nil {
		return nil, err
	}

	imageEventManager := messaging.NewEventManager[jobs.ImageStatusEvent](1)
	emojiEventManager := messaging.NewEventManager[jobs.EmojiPartialEvent](4)
	storageService := internalStorage.NewMinIOService(storageClient)

	natsSubscriber := messaging.NewNatsSubscriber(natsClient, imageEventManager, emojiEventManager)

	authConfig, err := auth.Init()
	if err != nil {
		return nil, err
	}

	redisClient := cache.MustGetClient()

	imageService := imageSvc.NewImageService(repo, storageService, redisClient, natsClient)
	emojiService := emojiSvc.NewEmojiService(repo, storageService, redisClient, natsClient)
	authService := authSvc.NewAuthService(repo, authConfig.PrivateKey, authConfig.JWTExpiry)

	return &App{
		db:                db,
		repo:              repo,
		natsClient:        natsClient,
		imageEventManager: imageEventManager,
		emojiEventManager: emojiEventManager,
		storageService:    storageService,
		natsSubscriber:    natsSubscriber,
		authConfig:        authConfig,
		imageSvc:          imageService,
		emojiSvc:          emojiService,
		authSvc:           authService,
		redisClient:       redisClient,
	}, nil
}

// Start begins all background services and returns the HTTP handler.
func (a *App) Start(ctx context.Context) http.Handler {
	go func() {
		if err := a.natsSubscriber.SubscribeToStatusEvents(ctx); err != nil {
			logger.Error().Err(err).Msg("NATS anime subscriber stopped")
		}
	}()

	go func() {
		if err := a.natsSubscriber.SubscribeToEmojiStatusEvents(ctx); err != nil {
			logger.Error().Err(err).Msg("NATS emoji subscriber stopped")
		}
	}()

	a.router = newRouter(
		a.imageEventManager,
		a.emojiEventManager,
		a.storageService,
		a.imageSvc,
		a.emojiSvc,
		a.authSvc,
		a.authConfig,
		a.redisClient,
	)
	return a.router
}

// Handler returns the HTTP handler for the application.
func (a *App) Handler() http.Handler {
	if a.router == nil {
		return nil
	}
	return a.router
}

// Close gracefully shuts down the application.
func (a *App) Close(ctx context.Context) error {
	if a.natsClient != nil {
		a.natsClient.Close()
	}

	if err := database.Close(); err != nil {
		logger.Error().Err(err).Msg("Failed to close database connection")
		return err
	}

	return nil
}
