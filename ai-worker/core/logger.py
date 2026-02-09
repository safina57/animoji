"""Structured logging configuration."""

import logging
import sys
from typing import Any
import json
from datetime import datetime
from core.settings import get_settings


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        

        log_data: dict[str, Any] = {
            "timestamp": datetime.now().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logger(name: str = "ai-worker") -> logging.Logger:
    """Configure and return a structured logger."""
    settings = get_settings()

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.log_level.upper()))

    # Remove existing handlers
    logger.handlers.clear()

    # Console handler with JSON formatting
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    # Prevent duplicate logging
    logger.propagate = False

    return logger


# Singleton logger instance
_logger: logging.Logger | None = None


def get_logger() -> logging.Logger:
    """Get the singleton logger instance."""
    global _logger
    if _logger is None:
        _logger = setup_logger()
    return _logger
