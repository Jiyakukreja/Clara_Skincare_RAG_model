from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.core.config import settings
from app.models.product import ProductRecommendation
from app.services.gemini_service import generate_with_gemini
from app.services.safety_checker import check_ingredient_safety
from rag.retriever import retrieve_products


class SkincareState(TypedDict, total=False):
    """Shared state passed between LangGraph nodes."""

    user_message: str
    skin_profile_summary: str
    intake_summary: str
    products: list[ProductRecommendation]
    safety_warnings: list[str]
    recommendation: str
    morning_routine: list[str]
    night_routine: list[str]
    lifestyle_tip: str


def _build_lifestyle_tip(state: SkincareState) -> str:
    summary = state.get("skin_profile_summary", "").lower()
    if "outdoor work" in summary:
        return "Reapply SPF through the day and keep antioxidants in the morning routine if you spend long hours outside."
    if "gym 4x+ /week" in summary or "gym 4x+" in summary:
        return "Cleanse soon after workouts and keep hydration lightweight so sweat does not trigger congestion."
    if "high stress" in summary:
        return "Keep barrier support simple and consistent, because stressed skin tends to respond best to fewer moving parts."
    if "poor sleep" in summary:
        return "Prioritize one restorative eye-care or overnight hydration step so your routine does the heavy lifting while you rest."
    if "heavy makeup daily" in summary:
        return "Double cleanse every night so makeup and sunscreen do not build up on the skin barrier."
    return "Stick to a routine you can repeat daily; consistency matters more than complexity."


def _build_local_recommendation(state: SkincareState) -> str:
    products = state.get("products", [])
    profile_summary = state.get("skin_profile_summary", "").lower()
    product_names = [product.name for product in products[:3]]
    product_sentence = (
        "Suggested products include " + ", ".join(product_names) + "."
        if product_names
        else "I could not find matching products right now."
    )

    routine_parts: list[str] = ["keep cleansing gentle", "moisturize well", "wear sunscreen daily"]
    if "oily" in profile_summary or "acne" in profile_summary:
        routine_parts.insert(1, "use one active at a time")
    if "dry" in profile_summary or "sensitive" in profile_summary:
        routine_parts.insert(1, "focus on barrier support")

    routine_text = ", ".join(routine_parts[:-1]) + f", and {routine_parts[-1]}"
    return (
        f"Based on your profile, {routine_text}. "
        f"{product_sentence} "
        "If irritation shows up, simplify the routine and slow down actives."
    )


async def intake_agent(state: SkincareState) -> SkincareState:
    """Extract basic user intent from the message."""
    message = state["user_message"]
    return {
        **state,
        "skin_profile_summary": state.get("skin_profile_summary", ""),
        "intake_summary": (
            "User is asking for skincare guidance. Prioritize skin type, concerns, "
            f"current actives, and budget clues from this message: {message}"
        ),
    }


async def product_retrieval_agent(state: SkincareState) -> SkincareState:
    """Retrieve products that match the user request."""
    query = f"{state.get('skin_profile_summary', '')}\n{state['user_message']}"
    products = await retrieve_products(query, top_k=5)
    return {**state, "products": products}


async def safety_checker_agent(state: SkincareState) -> SkincareState:
    """Check retrieved products against simple ingredient safety rules."""
    warnings = check_ingredient_safety(state["user_message"], state.get("products", []))
    return {**state, "safety_warnings": warnings}


async def recommendation_agent(state: SkincareState) -> SkincareState:
    """Generate a concise final recommendation with Gemini when configured."""
    products = state.get("products", [])
    skin_profile_summary = state.get("skin_profile_summary", "")
    product_context = "\n".join(
        f"- {product.name} by {product.brand} (MRP {product.price} {product.currency}): {product.description} "
        f"Ingredients: {', '.join(product.ingredients)}. Concerns: {', '.join(product.concerns)}."
        for product in products
    )
    safety_context = "\n".join(f"- {warning}" for warning in state.get("safety_warnings", []))

    morning_routine = [
        "Gentle cleanse or rinse",
        "Hydrating or calming serum",
        "Moisturizer",
        "Broad-spectrum sunscreen",
    ]
    night_routine = [
        "Cleanser",
        "Targeted treatment on selected nights",
        "Barrier-supporting moisturizer",
    ]

    prompt = (
        "You are Clara, a helpful skincare assistant.\n"
        "Important rules:\n"
        "- Answer skincare, routine, lifestyle, and diet questions directly when asked.\n"
        "- Recommend products only when they are relevant and only from the product context.\n"
        "- Do not invent products or mention listings outside the provided product context.\n"
        "- Mention safety warnings clearly.\n"
        "- Avoid medical diagnosis and suggest a dermatologist for severe symptoms.\n"
        "- Write 2 short practical paragraphs, then optionally add product recommendations if useful.\n\n"
        f"User message: {state['user_message']}\n\n"
        f"Skin profile summary: {skin_profile_summary}\n\n"
        f"Product context:\n{product_context}\n\n"
        f"Safety warnings:\n{safety_context}"
    )

    recommendation = _build_local_recommendation(state)
    if settings.gemini_api_key:
        try:
            recommendation = await generate_with_gemini(prompt)
        except Exception:
            recommendation = _build_local_recommendation(state)

    return {
        **state,
        "recommendation": recommendation or "I could not generate a recommendation.",
        "morning_routine": morning_routine,
        "night_routine": night_routine,
        "lifestyle_tip": _build_lifestyle_tip(state),
    }


def build_skincare_graph():
    """Build the Clara-style multi-agent graph."""
    graph = StateGraph(SkincareState)

    graph.add_node("intake", intake_agent)
    graph.add_node("retrieval", product_retrieval_agent)
    graph.add_node("safety", safety_checker_agent)
    graph.add_node("generate_recommendation", recommendation_agent)

    graph.set_entry_point("intake")
    graph.add_edge("intake", "retrieval")
    graph.add_edge("retrieval", "safety")
    graph.add_edge("safety", "generate_recommendation")
    graph.add_edge("generate_recommendation", END)

    return graph.compile()


skincare_graph = build_skincare_graph()


async def run_skincare_graph(user_message: str, skin_profile: dict | None = None) -> SkincareState:
    """Run the complete intake-to-recommendation agent workflow."""
    initial_state: SkincareState = {
        "user_message": user_message,
        "skin_profile_summary": str(skin_profile) if skin_profile else "",
    }
    return await skincare_graph.ainvoke(initial_state)
