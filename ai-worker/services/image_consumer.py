"""NATS message consumer for processing anime generation jobs."""

import json
import logging

from nats.aio.msg import Msg

from core.logger import get_logger
from core.minio_client import MinioClient, get_minio_client
from core.nats_client import NatsClient, get_nats_client
from core.settings import Settings, get_settings
from models.job import ImageJobMessage
from services.image_processor import ImageProcessor, get_image_processor


class ImageJobConsumer:
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
            self.logger.error(
                f"Failed to start job consumer: {e}", extra={"error": str(e)}
            )
            raise

    async def _publish_status(
        self,
        job_id: str,
        status: str,
        result_key: str | None = None,
        iteration_num: int = 0,
        response_id: str | None = None,
    ) -> None:
        """
        Publish job status to NATS for gateway SSE.

        Args:
            job_id: Job identifier
            status: Job status ("completed", "failed")
            result_key: Optional MinIO key for result
            iteration_num: Iteration number of the result
            response_id: OpenAI Responses API ID for conversation continuity
        """
        try:
            payload = {"status": status, "iteration_num": iteration_num}
            if result_key:
                payload["result_key"] = result_key
            if response_id:
                payload["response_id"] = response_id

            subject = f"anime.status.{job_id}"
            await self.nats_client.publish(subject, json.dumps(payload).encode())

            self.logger.info(
                "Published status to NATS",
                extra={
                    "job_id": job_id,
                    "status": status,
                    "iteration_num": iteration_num,
                    "subject": subject,
                },
            )
        except Exception as e:
            self.logger.error(
                f"Failed to publish status: {e}",
                extra={"job_id": job_id, "status": status, "error": str(e)},
            )

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
            job_message = ImageJobMessage(**data)
            job_id = job_message.job_id

            self.logger.info(
                "Received job message",
                extra={
                    "job_id": job_id,
                    "input_key": job_message.input_key,
                },
            )

            # Download original image from MinIO (stored for reference)
            self.logger.info("Downloading original image", extra={"job_id": job_id})
            image_data = await self.minio_client.download_file(job_message.input_key)
            self.logger.info(
                "Original image downloaded",
                extra={"job_id": job_id, "size": len(image_data)},
            )

            # Process the image with AI model
            self.logger.info("Processing image", extra={"job_id": job_id})
            result = await self.image_processor.process_image(
                job_id=job_id,
                user_prompt=job_message.prompt,
                input_image_data=image_data,
                input_mime_type=job_message.mime_type,
                target_width=job_message.width,
                target_height=job_message.height,
                previous_response_id=job_message.previous_response_id,
            )
            processed_data, content_type = result.image_data, result.content_type

            # Generate versioned output key for iteration
            output_key = f"tmp/{job_id}/result_v{job_message.iteration_num}.png"
            self.logger.info(
                "Uploading processed image",
                extra={
                    "job_id": job_id,
                    "output_key": output_key,
                    "iteration_num": job_message.iteration_num,
                },
            )
            await self.minio_client.upload_file(
                output_key, processed_data, content_type
            )

            await self._publish_status(
                job_id,
                "completed",
                output_key,
                job_message.iteration_num,
                result.response_id,
            )

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
            if job_id:
                await self._publish_status(job_id, "failed")


_job_consumer: ImageJobConsumer | None = None


def get_image_job_consumer() -> ImageJobConsumer:
    """Get the singleton ImageJobConsumer instance."""
    global _job_consumer
    if _job_consumer is not None:
        return _job_consumer

    _job_consumer = ImageJobConsumer(
        nats_client=get_nats_client(),
        minio_client=get_minio_client(),
        image_processor=get_image_processor(),
        settings=get_settings(),
        logger=get_logger(),
    )
    return _job_consumer
