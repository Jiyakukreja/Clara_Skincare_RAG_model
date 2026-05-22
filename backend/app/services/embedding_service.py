import asyncio

import httpx

from app.core.config import settings


class GeminiEmbeddingError(RuntimeError):
    """Raised when Gemini embeddings cannot be generated."""


def _retry_delay(error: Exception, attempt: int) -> float | None:
    if not isinstance(error, httpx.HTTPStatusError):
        return min(2**attempt, 8)

    status_code = error.response.status_code
    if status_code != 429 and status_code < 500:
        return None

    retry_after = error.response.headers.get("retry-after")
    if retry_after:
        try:
            return min(float(retry_after), 30)
        except ValueError:
            pass

    return min(2**attempt, 8)


async def embed_text(text: str) -> list[float]:
    """Create one Gemini embedding for semantic search."""
    if not settings.gemini_api_key:
        raise GeminiEmbeddingError("GEMINI_API_KEY is required for Gemini embeddings.")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.embedding_model}:embedContent"
    )
    payload = {
        "content": {
            "parts": [{"text": text}],
        },
        "output_dimensionality": settings.embedding_dimension,
    }

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=settings.external_request_timeout_seconds) as client:
        for attempt in range(settings.external_request_retries):
            try:
                response = await client.post(
                    url,
                    headers={"x-goog-api-key": settings.gemini_api_key},
                    json=payload,
                )
                response.raise_for_status()
                break
            except Exception as error:
                last_error = error
                delay = _retry_delay(error, attempt)
                if delay is None or attempt == settings.external_request_retries - 1:
                    break
                await asyncio.sleep(delay)
        else:
            pass

        if last_error is not None and "response" not in locals():
            raise GeminiEmbeddingError("Gemini embedding request failed.") from last_error
        if last_error is not None and response.is_error:
            raise GeminiEmbeddingError("Gemini embedding request failed.") from last_error

    data = response.json()
    embedding = data.get("embedding", {})
    values = embedding.get("values", [])
    if not values:
        raise GeminiEmbeddingError("Gemini did not return embedding values.")
    if len(values) != settings.embedding_dimension:
        raise GeminiEmbeddingError(
            f"Gemini returned {len(values)} embedding dimensions; expected {settings.embedding_dimension}."
        )

    return [float(value) for value in values]
