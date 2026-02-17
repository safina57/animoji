"""Job message model matching the Go NatsJobMessage structure."""

from pydantic import BaseModel, Field


class JobMessage(BaseModel):
    """
    Job message received from NATS queue.

    Matches the Go struct NatsJobMessage from gateway/internal/models/job.go
    """

    job_id: str = Field(..., description="Unique job identifier (UUID)")
    input_key: str = Field(..., description="MinIO object key for the input image")
    prompt: str = Field(
        default="anime style portrait",
        description="User's text prompt for image generation",
    )
    width: int = Field(..., description="Target image width in pixels")
    height: int = Field(..., description="Target image height in pixels")
    mime_type: str = Field(..., description="MIME type of the input image")
    iteration_num: int = Field(default=0, description="Iteration number for versioned storage")
