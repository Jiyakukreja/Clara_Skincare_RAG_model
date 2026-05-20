import asyncio
from dataclasses import dataclass

import httpx

from app.core.config import settings


class GeminiServiceError(RuntimeError):
    """Raised when Gemini does not return a usable model response."""


@dataclass(frozen=True)
class GeminiGeneration:
    text: str
    model: str


def _candidate_models() -> list[str]:
    models = [settings.gemini_model]
    models.extend(model.strip() for model in settings.gemini_backup_models.split(",") if model.strip())
    return list(dict.fromkeys(models))


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


async def generate_with_gemini(prompt: str) -> GeminiGeneration:
    """Generate recommendation text with Gemini using the REST API."""
    if not settings.gemini_api_key:
        raise GeminiServiceError("GEMINI_API_KEY is not configured.")

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": 220,
        },
    }

    last_error: Exception | None = None
    response: httpx.Response | None = None
    model_used = ""
    async with httpx.AsyncClient(timeout=30) as client:
        for model in _candidate_models():
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            for attempt in range(4):
                try:
                    response = await client.post(
                        url,
                        headers={"x-goog-api-key": settings.gemini_api_key},
                        json=payload,
                    )
                    response.raise_for_status()
                    last_error = None
                    model_used = model
                    break
                except Exception as error:
                    last_error = error
                    delay = _retry_delay(error, attempt)
                    if delay is None or attempt == 3:
                        break
                    await asyncio.sleep(delay)

            if response is not None and not response.is_error:
                break

        if response is None or response.is_error:
            raise GeminiServiceError("Gemini generation request failed for all configured Gemini models.") from last_error

    data = response.json()
    candidates = data.get("candidates", [])
    if not candidates:
        raise GeminiServiceError("Gemini returned no response candidates.")

    parts = candidates[0].get("content", {}).get("parts", [])
    text = "".join(part.get("text", "") for part in parts).strip()
    if not text:
        raise GeminiServiceError("Gemini returned an empty response.")

    return GeminiGeneration(text=text, model=model_used)
