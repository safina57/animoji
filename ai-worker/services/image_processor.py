"""Image processing service."""

import base64
import logging
from datetime import UTC, datetime

from pydantic_ai import Agent, BinaryContent
from pydantic_ai.models.openai import OpenAIResponsesModelSettings

from core.flux_client import FluxClient, get_flux_client
from core.logger import get_logger
from core.prompt_agent import get_prompt_agent
from core.settings import Settings, get_settings
from models.image_generation import (
    EnhancedPrompt,
    FluxRequest,
    GenerationResult,
)


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
        input_mime_type: str,
        target_width: int | None = None,
        target_height: int | None = None,
        previous_response_id: str | None = None,
    ) -> GenerationResult:
        """
        Run the full generation pipeline for a single job.

        Args:
            job_id: Unique job identifier for tracing.
            user_prompt: Raw prompt supplied by the user.
            input_image_data: Original image bytes to transform.
            input_mime_type: MIME type of the input image (validated by gateway).
            target_width: Target output image width (uses settings default if None).
            target_height: Target output image height (uses settings default if None).

        Returns:
            GenerationResult containing image bytes, content-type, and metadata.
        """
        # ── Stage 1: prompt enhancement ──────────────────────────────
        self.logger.info(
            "Enhancing prompt", extra={"job_id": job_id, "mime_type": input_mime_type}
        )

        # Build model settings — pass previous response ID when refining an existing job
        model_settings = None
        if previous_response_id:
            model_settings = OpenAIResponsesModelSettings(
                openai_previous_response_id=previous_response_id
            )

        agent_input = (
            user_prompt
            if previous_response_id
            else [
                user_prompt,
                BinaryContent(data=input_image_data, media_type=input_mime_type),
            ]
        )
        agent_result = await self.prompt_agent.run(
            agent_input, model_settings=model_settings
        )
        enhanced: EnhancedPrompt = agent_result.output

        # Extract response ID for conversation continuity in future iterations
        last_message = agent_result.all_messages()[-1]
        response_id: str | None = getattr(last_message, "provider_response_id", None)

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
        input_image_b64 = base64.b64encode(input_image_data).decode("utf-8")

        # Use provided dimensions or fall back to settings defaults
        width = target_width if target_width is not None else self.settings.flux_width
        height = (
            target_height if target_height is not None else self.settings.flux_height
        )

        flux_request = FluxRequest(
            prompt=enhanced.enhanced_text,
            input_image=input_image_b64,
            model=self.settings.flux_model,
            width=width,
            height=height,
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
            response_id=response_id,
            metadata={
                "job_id": job_id,
                "enhanced_prompt": enhanced.enhanced_text,
                "flux_params": {
                    "model": flux_request.model,
                    "width": flux_request.width,
                    "height": flux_request.height,
                    "input_image_size": len(input_image_b64),
                },
                "generated_at": datetime.now(UTC).isoformat(),
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
