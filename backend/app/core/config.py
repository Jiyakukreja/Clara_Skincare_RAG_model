from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    ai_provider: str = "gemini"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_backup_models: str = "gemini-flash-lite-latest,gemini-2.0-flash"
    frontend_url: str = "http://localhost:3000"
    database_url: str = ""
    vector_db_provider: str = "faiss"
    pinecone_api_key: str = ""
    pinecone_index_name: str = "clinikally-products"
    pinecone_namespace: str = "products"
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    embedding_model: str = "gemini-embedding-2"
    embedding_dimension: int = 768

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        """Allowed browser origins for local and deployed frontends."""
        configured_origins = [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]
        local_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
        return list(dict.fromkeys([*configured_origins, *local_origins]))


settings = Settings()
