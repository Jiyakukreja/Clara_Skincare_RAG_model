import httpx

from app.core.config import settings


async def embed_text(text: str) -> list[float]:
    """Create one Gemini embedding for semantic search."""
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required for Gemini embeddings.")

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

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            headers={"x-goog-api-key": settings.gemini_api_key},
            json=payload,
        )
        response.raise_for_status()

    data = response.json()
    embedding = data.get("embedding", {})
    values = embedding.get("values", [])
    if not values:
        raise RuntimeError("Gemini did not return embedding values.")

    return [float(value) for value in values]
