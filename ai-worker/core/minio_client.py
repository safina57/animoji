"""MinIO S3 client wrapper for object storage operations."""

import asyncio
from io import BytesIO

from minio import Minio
from minio.error import S3Error

from core.logger import get_logger
from core.settings import get_settings

logger = get_logger()


class MinioClient:
    """Wrapper around MinIO client for image storage operations."""

    def __init__(self):
        """Initialize MinIO client."""
        settings = get_settings()
        self.bucket = settings.minio_bucket

        try:
            self.client = Minio(
                endpoint=settings.minio_endpoint,
                access_key=settings.minio_access_key,
                secret_key=settings.minio_secret_key,
                secure=settings.minio_secure,
            )
            logger.info(
                "MinIO client initialized",
                extra={"endpoint": settings.minio_endpoint, "bucket": self.bucket},
            )
        except Exception as e:
            logger.error(f"Failed to initialize MinIO client: {e}", extra={"error": str(e)})
            raise

    def _download_sync(self, key: str) -> bytes:
        """Synchronous download helper."""
        response = self.client.get_object(self.bucket, key)
        data = response.read()
        response.close()
        response.release_conn()
        return data

    async def download_file(self, key: str) -> bytes:
        """
        Download a file from MinIO asynchronously.
        
        Offloads blocking I/O to thread pool to avoid blocking event loop.

        Args:
            key: Object key in MinIO bucket

        Returns:
            File content as bytes

        Raises:
            S3Error: If download fails
        """
        try:
            data = await asyncio.to_thread(self._download_sync, key)
            logger.info(f"Downloaded file from MinIO", extra={"key": key, "size": len(data)})
            return data

        except S3Error as e:
            logger.error(
                f"Failed to download from MinIO",
                extra={"key": key, "error": str(e), "code": e.code},
            )
            raise

    def _upload_sync(self, key: str, data: bytes, content_type: str) -> str:
        """Synchronous upload helper."""
        data_stream = BytesIO(data)
        length = len(data)

        self.client.put_object(
            bucket_name=self.bucket,
            object_name=key,
            data=data_stream,
            length=length,
            content_type=content_type,
        )
        return key

    async def upload_file(self, key: str, data: bytes, content_type: str = "image/png") -> str:
        """
        Upload a file to MinIO asynchronously.
        
        Offloads blocking I/O to thread pool to avoid blocking event loop.

        Args:
            key: Object key for the uploaded file
            data: File content as bytes
            content_type: MIME type of the file

        Returns:
            The object key of the uploaded file

        Raises:
            S3Error: If upload fails
        """
        try:
            length = len(data)
            await asyncio.to_thread(self._upload_sync, key, data, content_type)

            logger.info(
                f"Uploaded file to MinIO",
                extra={"key": key, "size": length, "content_type": content_type},
            )
            return key

        except S3Error as e:
            logger.error(
                f"Failed to upload to MinIO",
                extra={"key": key, "error": str(e), "code": e.code},
            )
            raise


# Singleton instance
_minio_client: MinioClient | None = None


def get_minio_client() -> MinioClient:
    """Get the singleton MinIO client instance."""
    global _minio_client
    if _minio_client is None:
        _minio_client = MinioClient()
    return _minio_client
