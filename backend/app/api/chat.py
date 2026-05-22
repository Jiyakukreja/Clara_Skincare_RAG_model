import asyncio
import logging

from fastapi import APIRouter
from fastapi import HTTPException

from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import generate_chat_response


router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Return an AI skincare response for the user's message."""
    try:
        return await asyncio.wait_for(
            generate_chat_response(
                request.message,
                request.skin_profile,
                include_recommendations=request.include_recommendations,
            ),
            timeout=settings.chat_timeout_seconds,
        )
    except asyncio.TimeoutError as error:
        logger.warning("Live Gemini skincare response timed out.")
        raise HTTPException(
            status_code=504,
            detail="The AI response took too long. Please try again in a moment.",
        ) from error
    except Exception as error:
        logger.exception("Live Gemini skincare response failed.")
        raise HTTPException(
            status_code=502,
            detail=(
                "Live Gemini response failed. Check GEMINI_API_KEY, GEMINI_MODEL, "
                "VECTOR_DB_PROVIDER, and embedding/vector database settings."
            ),
        ) from error
