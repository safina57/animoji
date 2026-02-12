package messaging

import (
	"sync"

	"github.com/safina57/animoji/gateway/internal/models"
	"github.com/safina57/animoji/gateway/pkg/logger"
)

// EventManager tracks active SSE connections and routes events to them
type EventManager struct {
	mu sync.RWMutex
	// Map of job_id to event channel
	connections map[string]chan models.StatusEvent
}

// NewEventManager creates a new EventManager instance
func NewEventManager() *EventManager {
	return &EventManager{
		connections: make(map[string]chan models.StatusEvent),
	}
}

// Register creates a new event channel for a job and registers it
func (m *EventManager) Register(jobID string) <-chan models.StatusEvent {
	m.mu.Lock()
	defer m.mu.Unlock()

	ch := make(chan models.StatusEvent, 1)
	m.connections[jobID] = ch

	return ch
}

// Unregister removes a channel from the connections list and closes it
func (m *EventManager) Unregister(jobID string, ch <-chan models.StatusEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.connections[jobID]; exists {
		close(m.connections[jobID])
		delete(m.connections, jobID)
	}
}

// NotifyJob sends an event to the connection waiting for a specific job
func (m *EventManager) NotifyJob(jobID string, event models.StatusEvent) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	ch, exists := m.connections[jobID]
	if !exists {
		logger.Debug().
			Str("job_id", jobID).
			Str("status", event.Status).
			Msg("Event received but no active SSE connection")
		return
	}

	// Send to the waiting connection
	select {
	case ch <- event:
		// Event sent successfully
	default:
		// Channel full, skip
		logger.Warn().Str("job_id", jobID).Msg("Channel full, skipping event")
	}
}
