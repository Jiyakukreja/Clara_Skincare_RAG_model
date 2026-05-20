import logging

from fastapi import APIRouter
from fastapi import HTTPException

from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import generate_chat_response


router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Return an AI skincare response for the user's message."""
    try:
        return await generate_chat_response(
            request.message,
            request.skin_profile,
            include_recommendations=request.include_recommendations,
        )
    except Exception as error:
        logger.exception("Live Gemini skincare response failed.")
        raise HTTPException(
            status_code=502,
            detail=(
                "Live Gemini response failed. Check GEMINI_API_KEY, GEMINI_MODEL, "
                "VECTOR_DB_PROVIDER, and embedding/vector database settings."
            ),
        ) from error
