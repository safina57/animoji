"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns:
        Status indicating the service is healthy
    """
    return {"status": "healthy", "service": "ai-worker"}
