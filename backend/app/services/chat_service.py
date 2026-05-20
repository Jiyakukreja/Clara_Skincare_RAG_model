from app.agents.skincare_graph import run_skincare_graph
from app.models.chat import ChatResponse, SkinProfile


DETAIL_KEYWORDS = {
    "routine",
    "product",
    "products",
    "recommend",
    "recommendation",
    "suggest",
    "cleanser",
    "moisturizer",
    "moisturiser",
    "sunscreen",
    "serum",
    "treatment",
    "cream",
    "gel",
    "spf",
}

TEXT_ONLY_KEYWORDS = {
    "diet",
    "food",
    "eat",
    "nutrition",
    "water",
    "drink",
    "intake",
    "sleep",
    "stress",
    "lifestyle",
}


def _format_skin_profile(profile: SkinProfile | None) -> str:
    if profile is None:
        return "No skin profile provided."

    current_actives = ", ".join(profile.current_actives) if profile.current_actives else "None"
    lifestyle = ", ".join(profile.lifestyle) if profile.lifestyle else "None"

    return (
        f"Skin type: {profile.skin_type or 'Not shared'}; "
        f"Main concern: {profile.main_concern or 'Not shared'}; "
        f"Current actives: {current_actives}; "
        f"Age stage: {profile.age_stage or 'Not shared'}; "
        f"Lifestyle: {lifestyle}."
    )


def _should_include_recommendation_details(message: str, requested_by_client: bool) -> bool:
    """Keep product/routine cards reserved for explicit recommendation requests."""
    if not requested_by_client:
        return False

    normalized = message.lower()
    has_detail_keyword = any(keyword in normalized for keyword in DETAIL_KEYWORDS)
    has_text_only_keyword = any(keyword in normalized for keyword in TEXT_ONLY_KEYWORDS)

    if has_text_only_keyword and not has_detail_keyword:
        return False

    return requested_by_client


async def generate_chat_response(
    message: str,
    skin_profile: SkinProfile | None = None,
    include_recommendations: bool = True,
) -> ChatResponse:
    """Run the Clara agent graph and return structured chat data."""
    include_details = _should_include_recommendation_details(message, include_recommendations)
    combined_message = f"{_format_skin_profile(skin_profile)}\nUser message: {message}" if skin_profile else message
    result = await run_skincare_graph(
        combined_message,
        skin_profile=skin_profile.model_dump() if skin_profile is not None else None,
        include_recommendations=include_details,
    )

    return ChatResponse(
        answer=result["recommendation"],
        products=result.get("products", []) if include_details else [],
        safety_warnings=result.get("safety_warnings", []) if include_details else [],
        morning_routine=result.get("morning_routine", []) if include_details else [],
        night_routine=result.get("night_routine", []) if include_details else [],
        lifestyle_tip=result.get("lifestyle_tip", "") if include_details else "",
        ai_source=result.get("ai_source", "live_gemini"),
        model_used=result.get("model_used", ""),
        show_details=include_details,
    )
