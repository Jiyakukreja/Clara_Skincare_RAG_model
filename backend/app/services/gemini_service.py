import httpx

from app.core.config import settings


async def generate_with_gemini(prompt: str) -> str:
    """Generate recommendation text with Gemini using the REST API."""
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": 700,
        },
    }

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=30) as client:
        for _ in range(3):
            try:
                response = await client.post(
                    url,
                    params={"key": settings.gemini_api_key},
                    json=payload,
                )
                response.raise_for_status()
                break
            except Exception as error:
                last_error = error
        else:
            if last_error is not None:
                raise last_error

    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return "I could not generate a Gemini recommendation right now."

    parts = candidates[0].get("content", {}).get("parts", [])
    return "".join(part.get("text", "") for part in parts).strip()
