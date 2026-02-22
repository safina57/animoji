"""Data models for image generation pipeline."""

from typing import Any

from pydantic import BaseModel, Field

from prompts.emotion_cues import EmotionName


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


class EmojiBaseStyle(BaseModel):
    """
    Structured output from the emoji style extraction agent.
    """

    character_description: str = Field(
        ...,
        description=(
            "Visual description of the subject in anime chibi form: species or type, "
            "key physical features, hair/fur colour and style, eye colour, "
            "distinctive traits. 2-3 sentences max."
        ),
    )
    art_style: str = Field(
        ...,
        description=(
            "Detected anime style reference from the user prompt (e.g. 'Demon Slayer', "
            "'One Piece', 'Spy x Family'). Use 'modern anime chibi' if none specified."
        ),
    )
    style_hallmarks: str = Field(
        ...,
        description=(
            "2-3 concrete visual hallmarks of the detected anime style applied to chibi "
            "rendering: colour palette behaviour, shading technique, linework character. "
            "Leave as empty string if no specific style was requested."
        ),
    )
    color_palette: str = Field(
        ...,
        description="Dominant colour palette for this character (e.g. 'golden yellow, cream white, warm browns').",
    )
    emotions: list[EmotionName] = Field(
        default_factory=list,
        description=(
            "Emotions explicitly requested in the user prompt. "
            "Must be values from the allowed emotion set. "
            "Empty list if no emotions were specified — consumer will fall back to defaults."
        ),
    )


class GenerationResult(BaseModel):
    """Final result from the image generation pipeline."""

    image_data: bytes
    content_type: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    response_id: str | None = Field(
        default=None,
        description="OpenAI Responses API response ID for conversation continuity across iterations",
    )

    model_config = {"arbitrary_types_allowed": True}
