"""
config.py

Reads all application settings from the .env file.
Uses pydantic-settings which validates types automatically.
If a required setting is missing, the app will refuse to start with a clear error message.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # OpenAI settings
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # Storage paths
    chroma_persist_dir: str = "./data/chroma_db"
    upload_dir: str = "./data/uploads"

    # Chunking settings
    chunk_size: int = 500
    chunk_overlap: int = 50

    # Retrieval settings
    retrieval_top_k: int = 5

    # Upload limits
    max_file_size_mb: int = 20

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Create a single shared instance
# Every other file imports this "settings" object
settings = Settings()