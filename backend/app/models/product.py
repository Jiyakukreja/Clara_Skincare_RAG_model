from pydantic import BaseModel


class Product(BaseModel):
    """A skincare product from the local recommendation dataset."""

    name: str
    brand: str
    ingredients: list[str]
    concerns: list[str]
    skin_type: list[str]
    price: float
    description: str
    currency: str = "INR"
    product_url: str = ""


class ProductRecommendation(BaseModel):
    """Product data returned to the frontend."""

    name: str
    brand: str
    price: float
    description: str
    ingredients: list[str]
    concerns: list[str]
    skin_type: list[str]
    currency: str = "INR"
    product_url: str = ""
    reason: str = ""
