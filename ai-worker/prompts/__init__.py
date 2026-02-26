"""
Prompts module for AI image generation.

Exports prompt classes for use throughout the application.
"""

from .anime_generation import AnimeGenerationPrompt
from .base import BasePrompt
from .emoji_generation import EmojiGenerationPrompt
from .emotion_cues import EMOTION_CUES, EmotionName, get_emotion_cue

__all__ = [
    "BasePrompt",
    "AnimeGenerationPrompt",
    "EmojiGenerationPrompt",
    "EMOTION_CUES",
    "EmotionName",
    "get_emotion_cue",
]
