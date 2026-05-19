from pydantic import BaseModel, Field

from app.models.product import ProductRecommendation


class SkinProfile(BaseModel):
    """Selected skin profile from the frontend intake."""

    skin_type: str = ""
    main_concern: str = ""
    current_actives: list[str] = Field(default_factory=list)
    age_stage: str = ""
    lifestyle: list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    """Request body for a user chat message."""

    message: str = Field(..., min_length=1, examples=["I have oily skin and acne. What should I use?"])
    skin_profile: SkinProfile | None = None


class ChatResponse(BaseModel):
    """Response body returned by the skincare assistant."""

    answer: str
    products: list[ProductRecommendation] = []
    safety_warnings: list[str] = []
    morning_routine: list[str] = []
    night_routine: list[str] = []
    lifestyle_tip: str = ""
