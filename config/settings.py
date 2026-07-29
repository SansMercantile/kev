"""
Configuration settings for Kev System
"""

import os
from typing import List

class Settings:
    """Settings for Kev System"""
    
    # Basic Settings
    SYSTEM_NAME = "kev"
    SYSTEM_DESCRIPTION = "Educational System"
    VERSION = "1.0.0"
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Server Settings
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8004))
    
    # Database Settings
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        f"postgresql://kev_user:password@localhost/kev_db"
    )
    DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "10"))
    DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "20"))
    
    # Security Settings
    SECRET_KEY = os.getenv("SECRET_KEY", "kev-secret-key-change-in-production")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:9004",
        "https://sansmercantile.com",
        "https://app.sansmercantile.com"
    ]
    
    # Logging Settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # External API Settings
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    GOOGLE_CLOUD_PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "")
    
    # Kev-specific settings
    
    # Kev-specific settings
    COURSE_DURATION_DAYS = int(os.getenv("COURSE_DURATION_DAYS", "90"))
    MAX_STUDENTS_PER_COURSE = int(os.getenv("MAX_STUDENTS_PER_COURSE", "100"))
    LEARNING_PATH_ALGORITHM = os.getenv("LEARNING_PATH_ALGORITHM", "adaptive")
    
    
    @classmethod
    def validate(cls):
        """Validate critical settings"""
        if not cls.SECRET_KEY or cls.SECRET_KEY == "your-secret-key-here":
            raise ValueError("SECRET_KEY must be set in production")
        
        return True

# Global settings instance
settings = Settings()
