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
	// Map of job_id to last event (buffered for late SSE connections)
	lastEvents map[string]models.StatusEvent
}

// NewEventManager creates a new EventManager instance
func NewEventManager() *EventManager {
	return &EventManager{
		connections: make(map[string]chan models.StatusEvent),
		lastEvents:  make(map[string]models.StatusEvent),
	}
}

// Register creates a new event channel for a job and registers it
// If there's a buffered event for this job, it will be immediately sent
func (m *EventManager) Register(jobID string) <-chan models.StatusEvent {
	m.mu.Lock()
	defer m.mu.Unlock()

	ch := make(chan models.StatusEvent, 1)
	m.connections[jobID] = ch

	// If there's a buffered event (job completed before SSE connection), send it immediately
	if bufferedEvent, exists := m.lastEvents[jobID]; exists {
		logger.Info().
			Str("job_id", jobID).
			Str("status", bufferedEvent.Status).
			Msg("Sending buffered event to new SSE connection")
		ch <- bufferedEvent
		// Clean up buffered event after sending
		delete(m.lastEvents, jobID)
	}

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
// If no connection exists, the event is buffered for when the SSE connection is established
func (m *EventManager) NotifyJob(jobID string, event models.StatusEvent) {
	m.mu.Lock()
	defer m.mu.Unlock()

	ch, exists := m.connections[jobID]
	if !exists {
		// Buffer the event for when SSE connection is established
		logger.Info().
			Str("job_id", jobID).
			Str("status", event.Status).
			Msg("No active SSE connection - buffering event for later delivery")
		m.lastEvents[jobID] = event
		return
	}

	// Send to the waiting connection
	select {
	case ch <- event:
		logger.Info().
			Str("job_id", jobID).
			Str("status", event.Status).
			Msg("Event sent to active SSE connection")
	default:
		// Channel full, skip
		logger.Warn().Str("job_id", jobID).Msg("Channel full, skipping event")
	}
}
