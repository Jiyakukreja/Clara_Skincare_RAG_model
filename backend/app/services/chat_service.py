from app.agents.skincare_graph import run_skincare_graph
from app.models.chat import ChatResponse, SkinProfile


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


async def generate_chat_response(
    message: str,
    skin_profile: SkinProfile | None = None,
    include_recommendations: bool = True,
) -> ChatResponse:
    """Run the Clara agent graph and return structured chat data."""
    combined_message = f"{_format_skin_profile(skin_profile)}\nUser message: {message}" if skin_profile else message
    result = await run_skincare_graph(
        combined_message,
        skin_profile=skin_profile.model_dump() if skin_profile is not None else None,
        include_recommendations=include_recommendations,
    )

    return ChatResponse(
        answer=result["recommendation"],
        products=result.get("products", []) if include_recommendations else [],
        safety_warnings=result.get("safety_warnings", []) if include_recommendations else [],
        morning_routine=result.get("morning_routine", []) if include_recommendations else [],
        night_routine=result.get("night_routine", []) if include_recommendations else [],
        lifestyle_tip=result.get("lifestyle_tip", "") if include_recommendations else "",
        ai_source=result.get("ai_source", "live_gemini"),
        model_used=result.get("model_used", ""),
        show_details=include_recommendations,
    )
