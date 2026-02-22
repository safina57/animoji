package messaging

import "sync"

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

// Unregister closes and removes the channel for the job and discards any
// remaining buffered events, preventing unbounded memory growth.
func (m *EventManager[T]) Unregister(jobID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.channels[jobID]; exists {
		close(m.channels[jobID])
		delete(m.channels, jobID)
	}
	delete(m.buffer, jobID)
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
