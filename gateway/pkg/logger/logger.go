package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

var Logger zerolog.Logger

// Init initializes the global logger with sensible defaults
func Init() {
	// Use ConsoleWriter for pretty colored output
	output := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: time.RFC3339,
	}

	Logger = zerolog.New(output).
		Level(zerolog.InfoLevel).
		With().
		Timestamp().
		Caller().
		Logger()

	// Set global logger
	log.Logger = Logger
}

// Info logs an info level message
func Info() *zerolog.Event {
	return Logger.Info()
}

// Error logs an error level message
func Error() *zerolog.Event {
	return Logger.Error()
}

// Debug logs a debug level message
func Debug() *zerolog.Event {
	return Logger.Debug()
}

// Warn logs a warning level message
func Warn() *zerolog.Event {
	return Logger.Warn()
}

// Fatal logs a fatal level message and exits
func Fatal() *zerolog.Event {
	return Logger.Fatal()
}
