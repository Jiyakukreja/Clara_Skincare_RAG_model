from app.core.config import settings
from app.models.product import ProductRecommendation
from rag.pinecone_store import PineconeProductStore
from rag.vector_store import get_vector_store


async def retrieve_products(query: str, top_k: int = 5) -> list[ProductRecommendation]:
    """Retrieve relevant Clinikally products using Gemini embeddings."""
    provider = settings.vector_db_provider.lower()
    if provider == "pinecone":
        products = await PineconeProductStore().search(query=query, top_k=top_k)
        retrieval_source = "Retrieved from Pinecone using Gemini embeddings."
    elif provider == "faiss":
        store = await get_vector_store()
        results = await store.search(query=query, top_k=top_k)
        products = [result.product for result in results]
        retrieval_source = "Retrieved from local FAISS using Gemini embeddings."
    else:
        raise RuntimeError(f"Unsupported VECTOR_DB_PROVIDER '{settings.vector_db_provider}'. Use 'faiss' or 'pinecone'.")

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
