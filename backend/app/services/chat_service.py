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


async def generate_chat_response(message: str, skin_profile: SkinProfile | None = None) -> ChatResponse:
    """Run the Clara agent graph and return structured chat data."""
    combined_message = f"{_format_skin_profile(skin_profile)}\nUser message: {message}" if skin_profile else message
    result = await run_skincare_graph(
        combined_message,
        skin_profile=skin_profile.model_dump() if skin_profile is not None else None,
    )

    return ChatResponse(
        answer=result.get("recommendation", "I could not generate a recommendation. Please try again."),
        products=result.get("products", []),
        safety_warnings=result.get("safety_warnings", []),
        morning_routine=result.get("morning_routine", []),
        night_routine=result.get("night_routine", []),
        lifestyle_tip=result.get("lifestyle_tip", ""),
    )
