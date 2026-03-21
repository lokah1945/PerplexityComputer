from functools import lru_cache

from openai import OpenAI

from local_computer.settings import settings


@lru_cache
def get_openai_client() -> tuple[OpenAI, str]:
    provider = settings.llm_provider.lower().strip()
    if provider == "perplexity":
        if not settings.perplexity_api_key.strip():
            raise ValueError(
                "PERPLEXITY_API_KEY kosong. Akun Max tidak menyertakan API — "
                "isi kunci dari portal API Perplexity (biaya terpisah) atau set LLM_PROVIDER=ollama."
            )
        client = OpenAI(
            api_key=settings.perplexity_api_key,
            base_url=settings.perplexity_base_url.rstrip("/"),
        )
        return client, settings.perplexity_model
    if provider == "ollama":
        base = settings.ollama_base_url.rstrip("/")
        client = OpenAI(base_url=f"{base}/v1", api_key="ollama")
        return client, settings.ollama_model
    raise ValueError(f"LLM_PROVIDER tidak dikenal: {settings.llm_provider}")
