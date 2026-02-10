"""Prompt enhancement agent."""

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.azure import AzureProvider

from core.settings import get_settings
from models.image_generation import EnhancedPrompt

SYSTEM_PROMPT = """\
You are an expert prompt engineer specializing in anime-style image generation.

Your task is to analyze the user's photo and their brief description, then create a rich, detailed \
prompt optimized for FLUX image generation to transform their photo into high-quality anime artwork.

Guidelines:
- CAREFULLY observe the person's features, pose, clothing, background, and overall composition in the photo
- Preserve key characteristics (hair color/style, clothing, pose, facial features, background elements)
- Enhance the prompt with specific anime aesthetics that complement the photo (e.g. Studio Ghibli, \
Makoto Shinkai, cel shading, vibrant colors, soft lighting)
- Add artistic details that enhance but don't contradict the original image
- Include quality-boosting tags (masterpiece, best quality, highly detailed)
- Keep the enhanced prompt concise but descriptive (under 200 words)
- Provide relevant style tags as a list
- Suggest a negative prompt to avoid common artifacts
- The goal is anime-style transformation while keeping the subject recognizable
"""

_prompt_agent: Agent[None, EnhancedPrompt] | None = None


def get_prompt_agent() -> Agent[None, EnhancedPrompt]:
    """Get the singleton prompt enhancement agent."""
    global _prompt_agent
    if _prompt_agent is not None:
        return _prompt_agent

    settings = get_settings()

    model = OpenAIChatModel(
        settings.azure_openai_deployment,
        provider=AzureProvider(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        ),
    )

    _prompt_agent = Agent(
        model,
        output_type=EnhancedPrompt,
        system_prompt=SYSTEM_PROMPT,
        retries=3,
    )

    return _prompt_agent
