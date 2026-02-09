"""Job message model matching the Go NatsJobMessage structure."""

from pydantic import BaseModel, ConfigDict, Field


class JobMessage(BaseModel):
    """
    Job message received from NATS queue.
    
    Matches the Go struct NatsJobMessage from gateway/internal/models/job.go
    """

    job_id: str = Field(..., description="Unique job identifier (UUID)")
    input_key: str = Field(..., description="MinIO object key for the input image")
