package database

import (
	"fmt"
	"os"
	"sync"

	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	dbInstance *gorm.DB
	dbOnce     sync.Once
)

// Init initializes GORM database connection and runs auto-migrations
func Init(models ...interface{}) (*gorm.DB, error) {
	var err error

	dbOnce.Do(func() {
		// Get database URL from environment
		databaseURL := os.Getenv("DATABASE_URL")
		if databaseURL == "" {
			err = fmt.Errorf("DATABASE_URL environment variable is not set")
			return
		}

		log.Info().Msg("Connecting to PostgreSQL database...")

		// Configure GORM
		config := &gorm.Config{
			Logger: logger.Default.LogMode(logger.Silent), // Silent in production, can change to logger.Info for dev
		}

		// Open database connection
		dbInstance, err = gorm.Open(postgres.Open(databaseURL), config)
		if err != nil {
			err = fmt.Errorf("failed to connect to database: %w", err)
			return
		}

		log.Info().Msg("Database connection established")

		// Run auto-migrations
		if len(models) > 0 {
			log.Info().Msg("Running auto-migrations...")
			if err = dbInstance.AutoMigrate(models...); err != nil {
				err = fmt.Errorf("failed to run auto-migrations: %w", err)
				return
			}
			log.Info().Msg("Auto-migrations completed successfully")
		}

		// Get underlying SQL DB for connection pool configuration
		sqlDB, sqlErr := dbInstance.DB()
		if sqlErr != nil {
			err = fmt.Errorf("failed to get SQL DB instance: %w", sqlErr)
			return
		}

		// Configure connection pool
		sqlDB.SetMaxOpenConns(25)
		sqlDB.SetMaxIdleConns(5)

		log.Info().
			Int("max_open_conns", 25).
			Int("max_idle_conns", 5).
			Msg("Database connection pool configured")
	})

	return dbInstance, err
}

// GetDB returns the GORM database instance
func GetDB() *gorm.DB {
	if dbInstance == nil {
		log.Fatal().Msg("Database not initialized. Call Init first.")
	}
	return dbInstance
}

// Close closes the database connection
func Close() error {
	if dbInstance != nil {
		sqlDB, err := dbInstance.DB()
		if err != nil {
			return fmt.Errorf("failed to get SQL DB instance: %w", err)
		}
		if err := sqlDB.Close(); err != nil {
			return fmt.Errorf("failed to close database connection: %w", err)
		}
		log.Info().Msg("Database connection closed")
	}
	return nil
}
