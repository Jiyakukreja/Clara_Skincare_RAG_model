from app.models.product import ProductRecommendation


RETINOID_TERMS = {"retinol", "retinal", "retinoid", "tretinoin", "adapalene"}
BENZOYL_TERMS = {"benzoyl", "benzoyl peroxide", "bp"}
SENSITIVE_TERMS = {"sensitive", "redness", "burning", "irritated", "rosacea"}


def check_ingredient_safety(user_message: str, products: list[ProductRecommendation]) -> list[str]:
    """Return simple ingredient conflict warnings for the MVP."""
    warnings: list[str] = []
    message = user_message.lower()

    uses_retinoid = any(term in message for term in RETINOID_TERMS)
    uses_benzoyl = any(term in message for term in BENZOYL_TERMS)
    has_sensitive_skin = any(term in message for term in SENSITIVE_TERMS)

    product_ingredients = {
        ingredient.lower()
        for product in products
        for ingredient in product.ingredients
    }
    recommends_retinoid = any(term in " ".join(product_ingredients) for term in RETINOID_TERMS)
    recommends_benzoyl = any(term in " ".join(product_ingredients) for term in BENZOYL_TERMS)

    if uses_retinoid and recommends_benzoyl:
        warnings.append(
            "Avoid layering retinoids and benzoyl peroxide in the same routine because irritation risk can increase."
        )

    if uses_benzoyl and recommends_retinoid:
        warnings.append(
            "Because you already use benzoyl peroxide, introduce retinoids on alternate nights only if your skin tolerates it."
        )

    if has_sensitive_skin:
        warnings.append(
            "For sensitive or redness-prone skin, patch test new actives and keep exfoliation to one or two nights per week."
        )

    if not warnings:
        warnings.append("No major ingredient conflicts detected from the details provided.")

    return warnings
