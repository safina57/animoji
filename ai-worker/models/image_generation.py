"""Data models for image generation pipeline."""

from typing import Any

from pydantic import BaseModel, Field


class EnhancedPrompt(BaseModel):
    """Structured output from the prompt enhancement agent."""

    enhanced_text: str = Field(
        ..., description="The enriched, detailed prompt for anime-style image generation"
    )
    style_tags: list[str] = Field(
        ..., description="Anime style tags (e.g. 'studio ghibli', 'vibrant colors', 'JOJO Bizarre Adventure style')"
    )
    negative_prompt: str = Field(
        default="",
        description="Elements to avoid in the generated image (e.g. 'blurry, low quality')",
    )


class FluxRequest(BaseModel):
    """Request parameters for Azure MaaS FLUX endpoint."""

    prompt: str
    input_image: str
    model: str = "FLUX.2-pro"
    width: int = 1024
    height: int = 1024
    n: int = 1


class GenerationResult(BaseModel):
    """Final result from the image generation pipeline."""

    image_data: bytes
    content_type: str
    metadata: dict[str, Any] = Field(default_factory=dict)

    model_config = {"arbitrary_types_allowed": True}
