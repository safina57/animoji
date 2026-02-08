"""FastAPI application for AI Worker service."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.logger import get_logger
from core.settings import get_settings
from core.minio_client import get_minio_client
from core.nats_client import get_nats_client
from routers import health
from services.consumer import JobConsumer
from services.image_processor import ImageProcessor

logger = get_logger()
settings = get_settings()

image_processor = ImageProcessor(logger=logger)
job_consumer = JobConsumer(
    nats_client=get_nats_client(),
    minio_client=get_minio_client(),
    image_processor=image_processor,
    settings=settings,
    logger=logger,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager - handles startup and shutdown.
    
    Startup: Initialize NATS client and start job consumer
    Shutdown: Clean up connections
    """
    # Startup
    logger.info("Starting AI Worker service")
    print("""
                
   █████████               ███                                     ███               █████████   █████
  ███░░░░░███             ░░░                                     ░░░               ███░░░░░███ ░░███ 
 ░███    ░███  ████████   ████  █████████████    ██████   ███████ ████             ░███    ░███  ░███ 
 ░███████████ ░░███░░███ ░░███ ░░███░░███░░███  ███░░███ ███░░███░░███  ██████████ ░███████████  ░███ 
 ░███░░░░░███  ░███ ░███  ░███  ░███ ░███ ░███ ░███ ░███░███ ░███ ░███ ░░░░░░░░░░  ░███░░░░░███  ░███ 
 ░███    ░███  ░███ ░███  ░███  ░███ ░███ ░███ ░███ ░███░███ ░███ ░███             ░███    ░███  ░███ 
 █████   █████ ████ █████ █████ █████░███ █████░░██████ ░░███████ █████            █████   █████ █████
░░░░░   ░░░░░ ░░░░ ░░░░░ ░░░░░ ░░░░░ ░░░ ░░░░░  ░░░░░░   ░░░░░███░░░░░            ░░░░░   ░░░░░ ░░░░░ 
                                                         ███ ░███                                     
                                                        ░░██████                                      
                                                         ░░░░░░                                       
                """)
    
    try:
        # Start the NATS consumer
        await job_consumer.start()
        logger.info("Job consumer started successfully")
    except Exception as e:
        logger.error(f"Failed to start job consumer: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down AI Worker service")


# Create FastAPI application
app = FastAPI(
    title="AI Worker Service",
    description="Anime image generation worker that processes jobs from NATS queue",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "ai-worker",
        "status": "running",
        "description": "Anime image generation worker",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.worker_port,
        log_level=settings.log_level.lower(),
    )
