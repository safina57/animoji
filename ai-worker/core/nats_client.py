"""NATS client wrapper for message queue operations."""

from collections.abc import Awaitable, Callable

import nats
from nats.aio.client import Client as NATSClient
from nats.aio.msg import Msg

from core.logger import get_logger
from core.settings import get_settings

logger = get_logger()


class NatsClient:
    """Wrapper around NATS client for pub/sub operations."""

    def __init__(self):
        """Initialize NATS client (connection happens in connect())."""
        self.client: NATSClient | None = None
        self.settings = get_settings()

    async def connect(self) -> None:
        """Establish connection to NATS server."""
        if self.client and self.client.is_connected:
            logger.info("NATS client already connected")
            return

        try:
            self.client = await nats.connect(
                servers=[self.settings.nats_url],
                name="ai-worker",
            )
            logger.info(
                "Connected to NATS",
                extra={
                    "url": self.settings.nats_url,
                    "client_name": "ai-worker",
                },
            )
        except Exception as e:
            logger.error(f"Failed to connect to NATS: {e}", extra={"error": str(e)})
            raise

    async def subscribe(
        self, subject: str, callback: Callable[[Msg], Awaitable[None]]
    ) -> None:
        """
        Subscribe to a NATS subject with an async callback.

        Args:
            subject: NATS subject to subscribe to
            callback: Async function to handle incoming messages
        """
        if not self.client or not self.client.is_connected:
            raise RuntimeError("NATS client not connected. Call connect() first.")

        try:
            await self.client.subscribe(subject, cb=callback)
            logger.info("Subscribed to NATS subject", extra={"subject": subject})
        except Exception as e:
            logger.error(
                "Failed to subscribe to NATS subject",
                extra={"subject": subject, "error": str(e)},
            )
            raise

    async def publish(self, subject: str, data: bytes) -> None:
        """
        Publish a message to a NATS subject.

        Args:
            subject: NATS subject to publish to
            data: Message payload as bytes
        """
        if not self.client or not self.client.is_connected:
            raise RuntimeError("NATS client not connected. Call connect() first.")

        try:
            await self.client.publish(subject, data)
            logger.debug("Published to NATS subject", extra={"subject": subject})
        except Exception as e:
            logger.error(
                "Failed to publish to NATS subject",
                extra={"subject": subject, "error": str(e)},
            )
            raise

    async def close(self) -> None:
        """Close the NATS connection."""
        if self.client and self.client.is_connected:
            await self.client.drain()
            logger.info("NATS connection closed")


# Singleton instance
_nats_client: NatsClient | None = None


def get_nats_client() -> NatsClient:
    """Get the singleton NATS client instance."""
    global _nats_client
    if _nats_client is None:
        _nats_client = NatsClient()
    return _nats_client
