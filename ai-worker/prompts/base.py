"""
Base prompt interface for AI prompt engineering.

Provides abstract base class for all prompt types to ensure
consistent structure and extensibility.
"""

from abc import ABC, abstractmethod


class BasePrompt(ABC):
    """
    Abstract base class for AI prompts.

    All prompt classes should inherit from this base class and implement
    the get_system_prompt method to return their specific prompt text.
    """

    @abstractmethod
    def get_system_prompt(self) -> str:
        """
        Return the system prompt text.

        Returns:
            str: The complete system prompt for the AI model
        """
        pass

    def __str__(self) -> str:
        """String representation returns the prompt text."""
        return self.get_system_prompt()
