"""Job message model matching the Go NatsJobMessage structure."""

from pydantic import BaseModel, Field


class JobMessage(BaseModel):
    """
    Job message received from NATS queue.
    
    Matches the Go struct NatsJobMessage from gateway/internal/models/job.go
    """

    job_id: str = Field(..., description="Unique job identifier (UUID)")
    input_key: str = Field(..., description="MinIO object key for the input image")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "input_key": "originals/550e8400-e29b-41d4-a716-446655440000/photo.jpg",
            }
        }
