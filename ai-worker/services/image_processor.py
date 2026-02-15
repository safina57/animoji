"""Image processing service."""

import base64
import logging
from datetime import datetime, timezone

from pydantic_ai import Agent, BinaryContent

from core.flux_client import FluxClient, get_flux_client
from core.settings import Settings, get_settings
from models.image_generation import (
    EnhancedPrompt,
    FluxRequest,
    GenerationResult,
)
from core.logger import get_logger
from core.prompt_agent import get_prompt_agent
from utils.image_utils import detect_image_mime_type
class ImageProcessor:
    """
    Orchestrates the image-generation pipeline
    
    """

    def __init__(
        self,
        prompt_agent: Agent[None, EnhancedPrompt],
        flux_client: FluxClient,
        settings: Settings,
        logger: logging.Logger,
    ):
        self.prompt_agent = prompt_agent
        self.flux_client = flux_client
        self.settings = settings
        self.logger = logger
        self.logger.info("ImageProcessor initialized")

    async def process_image(
        self,
        job_id: str,
        user_prompt: str,
        input_image_data: bytes,
    ) -> GenerationResult:
        """
        Run the full generation pipeline for a single job.

        Args:
            job_id: Unique job identifier for tracing.
            user_prompt: Raw prompt supplied by the user.
            input_image_data: Original image bytes to transform.

        Returns:
            GenerationResult containing image bytes, content-type, and metadata.
        """
        # ── Stage 1: prompt enhancement ──────────────────────────────
        self.logger.info("Enhancing prompt", extra={"job_id": job_id})
        
        # Detect image type from bytes
        image_mime_type = detect_image_mime_type(input_image_data)
        self.logger.info(
            "Detected image type",
            extra={"job_id": job_id, "mime_type": image_mime_type}
        )        
        # Pass both text and image to the agent
        agent_result = await self.prompt_agent.run(
            [
                user_prompt,
                BinaryContent(data=input_image_data, media_type=image_mime_type),
            ]
        )
        enhanced: EnhancedPrompt = agent_result.output

        self.logger.info(
            "Prompt enhanced",
            extra={
                "job_id": job_id,
                "enhanced_text": enhanced.enhanced_text,
                "style_tags": enhanced.style_tags,
            },
        )

        # ── Stage 2: FLUX image generation ───────────────────────────
        # Encode input image as base64 for FLUX API
        input_image_b64 = base64.b64encode(input_image_data).decode('utf-8')
        
        flux_request = FluxRequest(
            prompt=enhanced.enhanced_text,
            input_image=input_image_b64,
            model=self.settings.flux_model,
            width=self.settings.flux_width,
            height=self.settings.flux_height,
        )

        self.logger.info("Generating image with FLUX", extra={"job_id": job_id})
        image_bytes = await self.flux_client.generate(flux_request)

        self.logger.info(
            "Image generated successfully",
            extra={"job_id": job_id, "output_size": len(image_bytes)},
        )

        return GenerationResult(
            image_data=image_bytes,
            content_type="image/png",
            metadata={
                "job_id": job_id,
                "enhanced_prompt": enhanced.enhanced_text,
                "flux_params": {
                    "model": flux_request.model,
                    "width": flux_request.width,
                    "height": flux_request.height,
                    "input_image_size": len(input_image_b64),
                },
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

_image_processor: ImageProcessor | None = None


def get_image_processor() -> ImageProcessor:
    """Get the singleton ImageProcessor instance."""
    global _image_processor
    if _image_processor is not None:
        return _image_processor

    _image_processor = ImageProcessor(
        prompt_agent=get_prompt_agent(),
        flux_client=get_flux_client(),
        settings=get_settings(),
        logger=get_logger(),
    )
    return _image_processor
