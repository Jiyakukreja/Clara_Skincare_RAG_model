import asyncio
import logging
import re

from app.core.config import settings
from app.models.product import Product
from app.models.product import ProductRecommendation
from rag.pinecone_store import PineconeProductStore
from rag.product_loader import load_products, product_to_text
from rag.vector_store import get_vector_store


logger = logging.getLogger(__name__)


def _tokenize(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", text.lower()) if len(token) > 2}


def _keyword_search_products(query: str, top_k: int) -> list[Product]:
    """Fast local fallback for cold starts or vector provider slowdowns."""
    query_tokens = _tokenize(query)
    if not query_tokens:
        return load_products()[:top_k]

    scored_products: list[tuple[int, Product]] = []
    for product in load_products():
        product_tokens = _tokenize(product_to_text(product))
        score = len(query_tokens & product_tokens)
        if score:
            scored_products.append((score, product))

    scored_products.sort(key=lambda item: item[0], reverse=True)
    products = [product for _, product in scored_products[:top_k]]
    return products or load_products()[:top_k]


async def _retrieve_products_with_provider(query: str, top_k: int) -> tuple[list[Product], str]:
    provider = settings.vector_db_provider.lower()
    if provider == "pinecone":
        products = await PineconeProductStore().search(query=query, top_k=top_k)
        return products, "Retrieved from Pinecone using Gemini embeddings."
    if provider == "faiss":
        store = await get_vector_store()
        results = await store.search(query=query, top_k=top_k)
        return [result.product for result in results], "Retrieved from local FAISS using Gemini embeddings."

    raise RuntimeError(f"Unsupported VECTOR_DB_PROVIDER '{settings.vector_db_provider}'. Use 'faiss' or 'pinecone'.")


async def retrieve_products(query: str, top_k: int = 5) -> list[ProductRecommendation]:
    """Retrieve relevant Clinikally products using Gemini embeddings."""
    try:
        products, retrieval_source = await asyncio.wait_for(
            _retrieve_products_with_provider(query, top_k),
            timeout=settings.retrieval_timeout_seconds,
        )
    except Exception:
        logger.warning("Vector product retrieval failed; using local keyword fallback.", exc_info=True)
        products = _keyword_search_products(query, top_k)
        retrieval_source = "Matched from the local product catalog while vector search was unavailable."

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
            reason=retrieval_source,
        )
        for product in products
    ]
