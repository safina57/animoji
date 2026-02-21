package messaging

import "sync"

// EventManager is a generic, job-scoped SSE event router.
//
// It maps job IDs to buffered channels of type T and handles the race between
// the worker completing a job and the client opening an SSE connection:
//   - If events arrive before the SSE connection: they are buffered in a slice.
//   - When Register is called: buffered events are drained into the channel immediately.
//
// Instantiate with the appropriate event type and channel capacity:
//
//	messaging.NewEventManager[models.StatusEvent](1)          // anime: one terminal event
//	messaging.NewEventManager[messaging.EmojiPartialEvent](3) // emoji: up to 3 partial events
type EventManager[T any] struct {
	mu       sync.RWMutex
	channels map[string]chan T
	buffer   map[string][]T
	capacity int
}

// NewEventManager creates a new EventManager with the given channel capacity.
func NewEventManager[T any](capacity int) *EventManager[T] {
	return &EventManager[T]{
		channels: make(map[string]chan T),
		buffer:   make(map[string][]T),
		capacity: capacity,
	}
}

// Register creates a buffered channel for the job and drains any events that
// arrived before the SSE connection was established.
func (m *EventManager[T]) Register(jobID string) <-chan T {
	m.mu.Lock()
	defer m.mu.Unlock()

	ch := make(chan T, m.capacity)
	m.channels[jobID] = ch

	if buffered, exists := m.buffer[jobID]; exists {
		for _, event := range buffered {
			ch <- event
		}
		delete(m.buffer, jobID)
	}

	return ch
}

// Unregister closes and removes the channel for the job.
func (m *EventManager[T]) Unregister(jobID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.channels[jobID]; exists {
		close(m.channels[jobID])
		delete(m.channels, jobID)
	}
}

// NotifyJob delivers an event to the SSE connection for the job.
// If no connection is active yet the event is buffered for delivery on Register.
func (m *EventManager[T]) NotifyJob(jobID string, event T) {
	m.mu.Lock()
	defer m.mu.Unlock()

	ch, exists := m.channels[jobID]
	if !exists {
		m.buffer[jobID] = append(m.buffer[jobID], event)
		return
	}

	select {
	case ch <- event:
	default:
		// Channel full — drop the event rather than block.
	}
}
