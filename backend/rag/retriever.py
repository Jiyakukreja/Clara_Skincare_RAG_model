from collections import Counter

from app.core.config import settings
from app.models.product import Product, ProductRecommendation
from rag.pinecone_store import PineconeProductStore
from rag.product_loader import load_products, product_to_text
from rag.vector_store import get_vector_store


def _keyword_score(query: str, product: Product) -> int:
    """Simple local fallback when OpenAI embeddings are unavailable."""
    query_terms = set(query.lower().replace(",", " ").replace(".", " ").split())
    product_terms = Counter(product_to_text(product).lower().replace(",", " ").replace(".", " ").split())
    return sum(product_terms[term] for term in query_terms)


def _fallback_retrieve_products(query: str, top_k: int) -> list[Product]:
    products = load_products()
    ranked_products = sorted(products, key=lambda product: _keyword_score(query, product), reverse=True)
    return ranked_products[:top_k]


async def retrieve_products(query: str, top_k: int = 5) -> list[ProductRecommendation]:
    """Retrieve relevant Clinikally products using the configured vector provider."""
    try:
        if settings.vector_db_provider.lower() == "pinecone":
            products = await PineconeProductStore().search(query=query, top_k=top_k)
        else:
            store = await get_vector_store()
            results = await store.search(query=query, top_k=top_k)
            products = [result.product for result in results]
    except Exception:
        products = _fallback_retrieve_products(query=query, top_k=top_k)

    return [
        ProductRecommendation(
            name=product.name,
            brand=product.brand,
            price=product.price,
            description=product.description,
            ingredients=product.ingredients,
            concerns=product.concerns,
            skin_type=product.skin_type,
            currency=product.currency,
            product_url=product.product_url,
            reason="Matched your concern against the Clinikally-only product catalog.",
        )
        for product in products
    ]
