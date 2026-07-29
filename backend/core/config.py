"""
KEV Backend Configuration
"""

from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # Basic settings
    APP_NAME: str = "KEV AI-Native School"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///./kev_school.db"
    
    # Redis (for caching and sessions)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Agent System
    # Resolved relative to this file so it works on any machine/container,
    # instead of a hardcoded path that only existed on one dev box.
    AGENT_REGISTRY_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "multi_agents")
    SHARED_RESOURCES_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "shared_resources")

    # Bedrock (AWS) - used for all agent LLM calls, invoked per-request so the
    # server stays stateless and safe to run behind an ALB with N tasks.
    # NOTE: these newer Claude models are only invocable via a cross-region
    # inference profile ID (not the bare on-demand model ID) - confirmed via
    # `aws bedrock list-inference-profiles`.
    AWS_REGION: str = "us-east-1"
    BEDROCK_DEFAULT_MODEL_ID: str = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
    BEDROCK_EXPERT_MODEL_ID: str = "us.anthropic.claude-sonnet-5"
    
    # Avatar System
    AVATAR_SERVICE_URL: str = "http://localhost:8001"
    AVATAR_GENERATION_TIMEOUT: int = 30
    
    # External Services
    BRIGIT_SERVICE_URL: str = "http://localhost:8002"
    CONSTELLATION_INTEROP_URL: str = "http://localhost:8003"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "kev_backend.log"
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS: int = 1000
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "doc", "docx", "jpg", "png", "mp4"]
    
    # AI/ML Settings
    OPENAI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    
    # VR/AR Settings
    VR_ENABLED: bool = True
    AR_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        # The shared .env also carries frontend VITE_* vars (Vite reads them
        # directly) - don't fail backend startup just because they're present.
        extra = "ignore"

# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
elif os.getenv("ENVIRONMENT") == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"