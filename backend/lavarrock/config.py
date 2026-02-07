"""Configuration module for Lavarrock."""
from pydantic_settings import BaseSettings
from typing import Literal


class OllamaConfig(BaseSettings):
    """Ollama model provider configuration."""
    provider: Literal["ollama"] = "ollama"
    host: str = "http://localhost:11434"
    model_id: str = "llama3.1:latest"
    temperature: float = 0.7
    keep_alive: str = "10m"

    class Config:
        env_prefix = "OLLAMA_"


class BedrockConfig(BaseSettings):
    """AWS Bedrock model provider configuration."""
    provider: Literal["bedrock"] = "bedrock"
    model_id: str = "anthropic.claude-sonnet-4-20250514-v1:0"
    region: str = "us-west-2"
    profile: str | None = None
    temperature: float = 0.3

    class Config:
        env_prefix = "BEDROCK_"


class Settings(BaseSettings):
    """Main application settings."""
    # API
    api_title: str = "Lavarrock"
    api_version: str = "0.1.0"
    debug: bool = False

    # AI Model Configuration
    ai_provider: Literal["ollama", "bedrock"] = "ollama"
    
    # Ollama settings
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:latest"
    ollama_temperature: float = 0.7

    # Bedrock settings
    bedrock_region: str = "us-west-2"
    bedrock_model: str = "anthropic.claude-sonnet-4-20250514-v1:0"
    bedrock_temperature: float = 0.3

    # Database
    database_url: str = "sqlite:///./lavarrock.db"

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
