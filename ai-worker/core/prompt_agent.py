"""Prompt enhancement agent."""

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.azure import AzureProvider

from core.settings import get_settings
from models.image_generation import EnhancedPrompt

SYSTEM_PROMPT = """\
You are an expert prompt engineer specializing in anime-style image generation.

Your task is to take a user's brief description and expand it into a rich, detailed \
prompt optimized for FLUX image generation model to produce high-quality anime artwork.

Guidelines:
- Enhance the prompt with specific anime aesthetics (e.g. Studio Ghibli, Makoto Shinkai, \
cel shading, vibrant colors, soft lighting)
- Add composition details (framing, perspective, background elements)
- Include quality-boosting tags (masterpiece, best quality, highly detailed)
- Preserve the user's original intent — do not change the subject or meaning
- Keep the enhanced prompt concise but descriptive (under 200 words)
- Provide relevant style tags as a list
- Suggest a negative prompt to avoid common artifacts
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
