"""
Prompts module for AI image generation.

Exports prompt classes for use throughout the application.
"""

from .base import BasePrompt
from .anime_generation import AnimeGenerationPrompt

__all__ = [
    "BasePrompt",
    "AnimeGenerationPrompt",
]
