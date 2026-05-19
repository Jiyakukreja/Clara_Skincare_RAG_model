import hashlib

import httpx

from app.core.config import settings
from app.models.product import Product
from app.services.embedding_service import embed_text
from rag.product_loader import load_products, product_to_text


class PineconeProductStore:
    """Small Pinecone adapter for the Clinikally product catalog."""

    def __init__(self) -> None:
        self.products = load_products()
        self._host: str | None = None

    def _headers(self) -> dict[str, str]:
        if not settings.pinecone_api_key:
            raise RuntimeError("PINECONE_API_KEY is required for Pinecone retrieval.")

        return {
            "Api-Key": settings.pinecone_api_key,
            "Content-Type": "application/json",
            "X-Pinecone-API-Version": "2025-04",
        }

    async def _get_index_host(self) -> str:
        """Resolve the data-plane host for the configured Pinecone index."""
        if self._host:
            return self._host

        url = f"https://api.pinecone.io/indexes/{settings.pinecone_index_name}"
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(url, headers=self._headers())
            response.raise_for_status()

        data = response.json()
        host = data.get("host")
        if not host:
            raise RuntimeError("Pinecone index exists but no host was returned.")

        self._host = host
        return host

    def _product_id(self, product: Product) -> str:
        """Create a stable vector id from the product URL or name."""
        raw_id = product.product_url or f"{product.brand}-{product.name}"
        return hashlib.sha1(raw_id.encode("utf-8")).hexdigest()

    async def _upsert_products(self) -> None:
        """Embed and upsert the local Clinikally product catalog."""
        host = await self._get_index_host()
        vectors = []

        for index, product in enumerate(self.products):
            values = await embed_text(product_to_text(product))
            vectors.append(
                {
                    "id": self._product_id(product),
                    "values": values,
                    "metadata": {
                        "product_index": index,
                        "name": product.name,
                        "brand": product.brand,
                        "product_url": product.product_url,
                    },
                }
            )

        url = f"https://{host}/vectors/upsert"
        payload = {
            "namespace": settings.pinecone_namespace,
            "vectors": vectors,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, headers=self._headers(), json=payload)
            response.raise_for_status()

    async def _has_vectors(self) -> bool:
        """Check whether the configured namespace already has indexed vectors."""
        host = await self._get_index_host()
        url = f"https://{host}/describe_index_stats"

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=self._headers(), json={})
            response.raise_for_status()

        namespaces = response.json().get("namespaces", {})
        namespace_stats = namespaces.get(settings.pinecone_namespace, {})
        return int(namespace_stats.get("vectorCount", 0)) > 0

    async def ensure_indexed(self) -> None:
        """Populate Pinecone once if the product namespace is empty."""
        if not await self._has_vectors():
            await self._upsert_products()

    async def search(self, query: str, top_k: int = 5) -> list[Product]:
        """Search Pinecone and return matching local product records."""
        await self.ensure_indexed()

        host = await self._get_index_host()
        query_vector = await embed_text(query)
        url = f"https://{host}/query"
        payload = {
            "namespace": settings.pinecone_namespace,
            "vector": query_vector,
            "topK": top_k,
            "includeMetadata": True,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, headers=self._headers(), json=payload)
            response.raise_for_status()

        matches = response.json().get("matches", [])
        products: list[Product] = []
        for match in matches:
            metadata = match.get("metadata", {})
            product_index = metadata.get("product_index")
            if isinstance(product_index, int) and 0 <= product_index < len(self.products):
                products.append(self.products[product_index])

        return products
