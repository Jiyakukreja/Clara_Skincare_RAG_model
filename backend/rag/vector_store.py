import asyncio
from dataclasses import dataclass

import faiss
import numpy as np

from app.models.product import Product
from app.services.embedding_service import embed_text
from rag.product_loader import load_products, product_to_text


@dataclass
class VectorSearchResult:
    """A product with its vector similarity score."""

    product: Product
    score: float


class ProductVectorStore:
    """Small in-memory FAISS store for product semantic search."""

    def __init__(self) -> None:
        self.products = load_products()
        self.index: faiss.IndexFlatIP | None = None

    async def _embed_texts(self, texts: list[str]) -> np.ndarray:
        """Create normalized Gemini embeddings for FAISS inner-product search."""
        vectors = [await embed_text(text) for text in texts]
        embeddings = np.array(vectors, dtype="float32")
        faiss.normalize_L2(embeddings)
        return embeddings

    async def build(self) -> None:
        """Build the FAISS index from the product dataset."""
        product_texts = [product_to_text(product) for product in self.products]
        embeddings = await self._embed_texts(product_texts)

        self.index = faiss.IndexFlatIP(embeddings.shape[1])
        self.index.add(embeddings)

    async def search(self, query: str, top_k: int = 5) -> list[VectorSearchResult]:
        """Find products semantically similar to the user's query."""
        if self.index is None:
            await self.build()

        query_embedding = await self._embed_texts([query])
        scores, indexes = self.index.search(query_embedding, top_k)

        return [
            VectorSearchResult(product=self.products[index], score=float(score))
            for score, index in zip(scores[0], indexes[0])
            if index >= 0
        ]


_store: ProductVectorStore | None = None
_store_lock = asyncio.Lock()


async def get_vector_store() -> ProductVectorStore:
    """Create one shared vector store for the running API process."""
    global _store

    async with _store_lock:
        if _store is None:
            _store = ProductVectorStore()
        return _store
