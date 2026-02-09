"""Azure MaaS FLUX client for image generation."""

import asyncio
import base64
import logging

import httpx

from core.settings import get_settings
from core.logger import get_logger
from models.image_generation import FluxRequest

_MAX_RETRIES = 3


class FluxClient:
    """Client for Azure AI Foundry FLUX.2-pro image generation."""

    def __init__(
        self,
        endpoint: str,
        api_key: str,
        logger: logging.Logger,
    ):
        self.endpoint = endpoint
        self.api_key = api_key
        self.logger = logger
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(120.0, connect=10.0),
            limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
        )

    async def generate(self, request: FluxRequest) -> bytes:
        """
        Generate an image via Azure MaaS FLUX endpoint.

        Returns the raw image bytes decoded from the base64
        response returned by the API.
        """
        response_data = await self._call_api(request)

        b64_json = response_data["data"][0]["b64_json"]
        image_bytes = base64.b64decode(b64_json)

        self.logger.info(
            "FLUX generation succeeded",
            extra={"output_size": len(image_bytes)},
        )

        return image_bytes

    async def close(self) -> None:
        """Cleanly shut down the underlying HTTP client."""
        await self._client.aclose()

    async def _call_api(self, request: FluxRequest, attempt: int = 1) -> dict:
        """POST to FLUX endpoint"""
        response = await self._client.post(
            self.endpoint,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=request.model_dump(),
        )

        if response.status_code == 429 and attempt <= _MAX_RETRIES:
            retry_after = int(response.headers.get("Retry-After", "30"))
            self.logger.warning(
                "FLUX rate-limited, retrying",
                extra={"retry_after": retry_after, "attempt": attempt},
            )
            await asyncio.sleep(retry_after)
            return await self._call_api(request, attempt + 1)

        if not response.is_success:
            # Log error details before raising
            self.logger.error(
                "FLUX API request failed",
                extra={
                    "status_code": response.status_code,
                    "response_body": response.text,
                    "request_payload": request.model_dump(),
                },
            )
        response.raise_for_status()
        data = response.json()

        # Log response structure without the bulky base64 image data
        sanitized = {
            k: v for k, v in data.items() if k != "data"
        }
        if "data" in data and isinstance(data["data"], list):
            sanitized["data"] = [
                {k: (f"<{len(v)} chars>" if k == "b64_json" else v)
                 for k, v in item.items()}
                for item in data["data"]
            ]
        self.logger.info(
            "FLUX API response received",
            extra={"response": sanitized, "status_code": response.status_code},
        )

        return data

_flux_client: FluxClient | None = None


def get_flux_client() -> FluxClient:
    """Get the singleton FluxClient instance."""
    global _flux_client
    if _flux_client is not None:
        return _flux_client

    settings = get_settings()
    logger = get_logger()

    _flux_client = FluxClient(
        endpoint=settings.azure_flux_endpoint,
        api_key=settings.azure_flux_api_key,
        logger=logger,
    )

    logger.info(
        "FluxClient initialized",
        extra={"endpoint": settings.azure_flux_endpoint},
    )
    return _flux_client
