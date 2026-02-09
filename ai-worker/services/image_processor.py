"""Image processing service."""

import logging
from datetime import datetime, timezone

from pydantic_ai import Agent

from core.flux_client import FluxClient, get_flux_client
from core.settings import Settings, get_settings
from models.image_generation import (
    EnhancedPrompt,
    FluxRequest,
    GenerationResult,
)
from core.logger import get_logger
from core.prompt_agent import get_prompt_agent
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
    ) -> GenerationResult:
        """
        Run the full generation pipeline for a single job.

        Args:
            job_id: Unique job identifier for tracing.
            user_prompt: Raw prompt supplied by the user.

        Returns:
            GenerationResult containing image bytes, content-type, and metadata.
        """
        # ── Stage 1: prompt enhancement ──────────────────────────────
        self.logger.info("Enhancing prompt", extra={"job_id": job_id})
        agent_result = await self.prompt_agent.run(user_prompt)
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
        flux_request = FluxRequest(
            prompt=enhanced.enhanced_text,
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
                "flux_params": flux_request.model_dump(),
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
