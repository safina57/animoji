"""Job message models matching the Go NATS message structures."""

from pydantic import BaseModel, Field


class BaseJobMessage(BaseModel):
    """
    Shared fields for all NATS job messages.
    """

    job_id: str = Field(..., description="Unique job identifier (UUID)")
    input_key: str = Field(..., description="MinIO object key for the input image")
    prompt: str = Field(..., description="User's text prompt")
    mime_type: str = Field(..., description="MIME type of the input image")


class ImageJobMessage(BaseJobMessage):
    """
    Anime generation job message received from NATS.

    Matches the Go struct NatsJobMessage from gateway/internal/models/job.go.
    """

    width: int = Field(..., description="Target image width in pixels")
    height: int = Field(..., description="Target image height in pixels")
    iteration_num: int = Field(
        default=0, description="Iteration number for versioned storage"
    )
    previous_response_id: str | None = Field(
        default=None,
        description="OpenAI Responses API ID from prior iteration for conversation continuity",
    )


class EmojiJobMessage(BaseJobMessage):
    """
    Emoji generation job message received from NATS.

    Matches the Go struct EmojiNatsJobMessage from gateway/internal/models/job.go.
    """
