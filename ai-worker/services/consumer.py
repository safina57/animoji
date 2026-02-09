"""NATS message consumer for processing anime generation jobs."""

import json
import logging
from nats.aio.msg import Msg

from core.minio_client import MinioClient
from core.nats_client import NatsClient
from core.settings import Settings
from models.job import JobMessage
from services.image_processor import ImageProcessor


class JobConsumer:
    """
    Consumes job messages from NATS queue and processes them.
    
    Workflow:
    1. Receive message from subject
    2. Download original image from MinIO
    3. Process image with AI model
    4. Upload result to MinIO
    
    """

    def __init__(
        self,
        nats_client: NatsClient,
        minio_client: MinioClient,
        image_processor: ImageProcessor,
        settings: Settings,
        logger: logging.Logger,
    ):
        """
        Initialize the job consumer with injected dependencies.
        
        Args:
            nats_client: NATS messaging client
            minio_client: MinIO storage client
            image_processor: Image processing service
            settings: Application settings
            logger: Structured logger
        """
        self.nats_client = nats_client
        self.minio_client = minio_client
        self.image_processor = image_processor
        self.settings = settings
        self.logger = logger

    async def start(self) -> None:
        """Start consuming messages from NATS."""
        try:
            # Ensure NATS connection is established
            await self.nats_client.connect()

            # Subscribe to the job subject
            await self.nats_client.subscribe(
                subject=self.settings.nats_subject,
                callback=self._handle_message,
            )

            self.logger.info(
                "Job consumer started",
                extra={"subject": self.settings.nats_subject},
            )

        except Exception as e:
            self.logger.error(f"Failed to start job consumer: {e}", extra={"error": str(e)})
            raise

    async def _handle_message(self, msg: Msg) -> None:
        """
        Handle incoming NATS message.
        
        Args:
            msg: NATS message containing job data
        """
        job_id = None
        try:
            # Parse the message payload
            data = json.loads(msg.data.decode())
            job_message = JobMessage(**data)
            job_id = job_message.job_id

            self.logger.info(
                "Received job message",
                extra={
                    "job_id": job_id,
                    "input_key": job_message.input_key,
                },
            )

            # Download original image from MinIO
            self.logger.info("Downloading original image", extra={"job_id": job_id})
            image_data = await self.minio_client.download_file(job_message.input_key)

            # Process the image with AI model
            self.logger.info("Processing image", extra={"job_id": job_id})
            processed_data, content_type = await self.image_processor.process_image(
                job_id, image_data
            )

            # Upload processed image to MinIO
            output_key = f"generated/{job_id}/result.png"
            self.logger.info(
                "Uploading processed image",
                extra={"job_id": job_id, "output_key": output_key},
            )
            await self.minio_client.upload_file(output_key, processed_data, content_type)

            self.logger.info(
                "Job completed successfully",
                extra={
                    "job_id": job_id,
                    "input_key": job_message.input_key,
                    "output_key": output_key,
                },
            )

        except json.JSONDecodeError as e:
            self.logger.error(
                f"Invalid JSON in message: {e}",
                extra={"error": str(e), "raw_data": msg.data.decode()},
            )

        except Exception as e:
            self.logger.error(
                f"Error processing job: {e}",
                extra={"job_id": job_id, "error": str(e)},
                exc_info=True,
            )
