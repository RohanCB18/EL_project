import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings loaded from environment variables."""
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS settings
    CORS_ORIGINS: list = [
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # OpenRouter settings
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemma-3-27b-it:free")
    
    # Vector store settings
    VECTOR_STORE_PATH: str = os.getenv("VECTOR_STORE_PATH", "./vector_stores")
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {"pdf"}


settings = Settings()
