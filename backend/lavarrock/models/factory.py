"""Model provider factory for supporting multiple LLM providers."""
from typing import Any, Union
from lavarrock.config import OllamaConfig, BedrockConfig, Settings


class ModelFactory:
    """Factory for creating model instances from configuration."""

    @staticmethod
    def create_model(config: Union[OllamaConfig, BedrockConfig, dict]) -> Any:
        """
        Create a Strands model instance from provider configuration.

        Args:
            config: Configuration dict or Pydantic model instance

        Returns:
            Model instance (OllamaModel or BedrockModel)

        Raises:
            ValueError: If provider is not supported
        """
        # Convert dict to config if needed
        if isinstance(config, dict):
            provider = config.get("provider")
            if provider == "ollama":
                config = OllamaConfig(**config)
            elif provider == "bedrock":
                config = BedrockConfig(**config)
            else:
                raise ValueError(f"Unsupported provider: {provider}")

        if isinstance(config, OllamaConfig):
            return ModelFactory._create_ollama_model(config)
        elif isinstance(config, BedrockConfig):
            return ModelFactory._create_bedrock_model(config)
        else:
            raise ValueError(f"Unsupported config type: {type(config)}")

    @staticmethod
    def _create_ollama_model(config: OllamaConfig) -> Any:
        """Create Ollama model instance."""
        # Import here to avoid hard dependency on Ollama
        try:
            from strands.models.ollama import OllamaModel
        except ImportError:
            raise ImportError("Ollama support requires 'strands-agents[ollama]' to be installed")

        return OllamaModel(
            host=config.host,
            model_id=config.model_id,
            temperature=config.temperature,
            keep_alive=config.keep_alive,
        )

    @staticmethod
    def _create_bedrock_model(config: BedrockConfig) -> Any:
        """Create Bedrock model instance."""
        # Import here to avoid hard dependency on AWS
        try:
            from strands.models import BedrockModel
            import boto3
        except ImportError:
            raise ImportError(
                "Bedrock support requires 'strands-agents[bedrock]' and 'boto3' to be installed"
            )

        client_kwargs = {}
        if config.region:
            client_kwargs["region_name"] = config.region
        
        if config.profile:
            session = boto3.Session(profile_name=config.profile)
            client_kwargs["client"] = session.client("bedrock-runtime")

        return BedrockModel(
            model_id=config.model_id,
            temperature=config.temperature,
            streaming=True,
            **client_kwargs,
        )

    @staticmethod
    def create_from_settings(settings: Settings) -> Any:
        """Create model instance from application settings."""
        if settings.ai_provider == "ollama":
            config = OllamaConfig(
                host=settings.ollama_host,
                model_id=settings.ollama_model,
                temperature=settings.ollama_temperature,
            )
        elif settings.ai_provider == "bedrock":
            config = BedrockConfig(
                model_id=settings.bedrock_model,
                region=settings.bedrock_region,
                temperature=settings.bedrock_temperature,
            )
        else:
            raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")

        return ModelFactory.create_model(config)
