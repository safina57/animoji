package messaging

import (
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/safina57/animoji/gateway/internal/constants"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

var (
	natsInstance *NatsClient
	natsOnce     sync.Once
	natsInitErr  error
)

// NatsClient wraps the NATS connection.
type NatsClient struct {
	conn *nats.Conn
}

// GetClient returns the singleton NATS client instance.
func GetClient() (*NatsClient, error) {
	natsOnce.Do(func() {
		natsInstance, natsInitErr = initializeClient()
	})
	return natsInstance, natsInitErr
}

// MustGetClient returns the singleton NATS client.
func MustGetClient() *NatsClient {
	client, err := GetClient()
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to get NATS client")
	}
	return client
}

// Publish sends a message to the given subject.
func (c *NatsClient) Publish(subject string, payload []byte) error {
	if c == nil || c.conn == nil {
		return fmt.Errorf("nats connection not initialized")
	}

	if err := c.conn.Publish(subject, payload); err != nil {
		return fmt.Errorf("failed to publish to subject %s: %w", subject, err)
	}

	return nil
}

// Close closes the NATS connection.
func (c *NatsClient) Close() {
	if c != nil && c.conn != nil {
		c.conn.Close()
	}
}

func initializeClient() (*NatsClient, error) {
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = constants.DefaultNatsURL
	}

	conn, err := nats.Connect(
		url,
		nats.Name("animoji-gateway"),
		nats.Timeout(5*time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	logger.Info().Str("url", url).Msg("NATS client initialized successfully")

	return &NatsClient{conn: conn}, nil
}
