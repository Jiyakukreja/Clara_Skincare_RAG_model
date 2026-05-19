from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.core.config import settings


app = FastAPI(
    title="AI Skincare Recommendation API",
    description="Async FastAPI backend for AI skincare chat and product recommendations.",
    version="0.1.0",
)

# CORS lets the Next.js frontend call this backend from localhost during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Simple endpoint to confirm the backend is running."""
    return {"status": "ok"}


app.include_router(chat_router)
