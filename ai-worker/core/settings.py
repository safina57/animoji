"""Application settings and configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # NATS Configuration
    nats_url: str = "nats://nats:4222"
    nats_subject: str = "anime.generate"

    # MinIO Configuration
    minio_endpoint: str = "minio:9000"
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str = "animoji-images"
    minio_secure: bool = False

    # Azure OpenAI Configuration
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_api_version: str = "2024-07-01-preview"

    # Azure FLUX Configuration
    azure_flux_endpoint: str = ""
    azure_flux_api_key: str = ""
    flux_model: str = "FLUX.2-pro"
    flux_width: int = 1024
    flux_height: int = 1024

    # Application Configuration
    log_level: str = "INFO"
    worker_port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False


# Singleton instance
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get the singleton settings instance."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
