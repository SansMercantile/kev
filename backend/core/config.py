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
    AGENT_REGISTRY_PATH: str = "/workspace/constellation/kev/multi_agents"
    SHARED_RESOURCES_PATH: str = "/workspace/constellation/shared_resources"
    
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

# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
elif os.getenv("ENVIRONMENT") == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"