"""LLM prompt agents (pydantic-ai) for the AI worker."""

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.azure import AzureProvider

from core.settings import get_settings
from models.image_generation import EmojiBaseStyle, EnhancedPrompt
from prompts import AnimeGenerationPrompt, EmojiGenerationPrompt

# ── Shared model factory ───────────────────────────────────────────────────────

def _build_azure_model() -> OpenAIResponsesModel:
    settings = get_settings()
    return OpenAIResponsesModel(
        settings.azure_openai_deployment,
        provider=AzureProvider(
            azure_endpoint=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
        ),
    )


# ── Anime prompt agent ─────────────────────────────────────────────────────────

_prompt_agent: Agent[None, EnhancedPrompt] | None = None


def get_prompt_agent() -> Agent[None, EnhancedPrompt]:
    """Get the singleton anime prompt enhancement agent."""
    global _prompt_agent
    if _prompt_agent is not None:
        return _prompt_agent

    _prompt_agent = Agent(
        _build_azure_model(),
        output_type=EnhancedPrompt,
        system_prompt=AnimeGenerationPrompt().get_system_prompt(),
        retries=3,
    )
    return _prompt_agent


# ── Emoji prompt agent ─────────────────────────────────────────────────────────

_emoji_prompt_agent: Agent[None, EmojiBaseStyle] | None = None


def get_emoji_prompt_agent() -> Agent[None, EmojiBaseStyle]:
    """Get the singleton emoji style extraction agent."""
    global _emoji_prompt_agent
    if _emoji_prompt_agent is not None:
        return _emoji_prompt_agent

    _emoji_prompt_agent = Agent(
        _build_azure_model(),
        output_type=EmojiBaseStyle,
        system_prompt=EmojiGenerationPrompt().get_system_prompt(),
        retries=3,
    )
    return _emoji_prompt_agent
