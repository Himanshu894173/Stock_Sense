import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "StockSense Inventory ERP"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "stocksense-super-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database URL defaults to local SQLite file for immediate out-of-the-box readiness,
    # but seamlessly switches to PostgreSQL if DATABASE_URL env is set.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./stocksense.db"
    )

    class Config:
        case_sensitive = True

settings = Settings()
