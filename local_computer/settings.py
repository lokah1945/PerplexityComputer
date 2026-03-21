from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    llm_provider: str = "ollama"  # ollama | perplexity

    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2"

    perplexity_api_key: str = ""
    perplexity_model: str = "sonar"
    perplexity_base_url: str = "https://api.perplexity.ai"

    workspace: Path = Path("./workspace")
    sandbox_image: str = "debian:12-slim"
    sandbox_network: str = "bridge"
    command_timeout_sec: int = 180


settings = Settings()
