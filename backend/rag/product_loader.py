import json
from functools import lru_cache
from pathlib import Path

from app.models.product import Product


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "products.json"


@lru_cache(maxsize=1)
def load_products() -> list[Product]:
    """Load products once and reuse them for all requests."""
    with DATA_PATH.open("r", encoding="utf-8") as file:
        raw_products = json.load(file)

    return [Product(**product) for product in raw_products]


def product_to_text(product: Product) -> str:
    """Convert product fields into searchable text for embeddings."""
    return (
        f"{product.name} by {product.brand}. "
        f"Description: {product.description}. "
        f"Ingredients: {', '.join(product.ingredients)}. "
        f"Concerns: {', '.join(product.concerns)}. "
        f"Skin types: {', '.join(product.skin_type)}. "
        f"Price: {product.currency} {product.price:.2f}. "
        f"Clinikally product URL: {product.product_url}."
    )
