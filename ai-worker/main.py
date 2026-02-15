"""FastAPI application for AI Worker service."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.logger import get_logger
from core.settings import get_settings
from core.flux_client import get_flux_client
from routers import health
from services.consumer import get_job_consumer

logger = get_logger()
settings = get_settings()


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
        job_consumer = get_job_consumer()
        await job_consumer.start()
        logger.info("Job consumer started successfully")
    except Exception as e:
        logger.error(f"Failed to start job consumer: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down AI Worker service")
    await get_flux_client().close()


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
