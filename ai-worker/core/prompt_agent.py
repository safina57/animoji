"""Prompt enhancement agent."""

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.azure import AzureProvider

from core.settings import get_settings
from models.image_generation import EnhancedPrompt
from prompts import AnimeGenerationPrompt

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
    anime_prompt = AnimeGenerationPrompt()

    _prompt_agent = Agent(
        model,
        output_type=EnhancedPrompt,
        system_prompt=anime_prompt.get_system_prompt(),
        retries=3,
    )

    return _prompt_agent
