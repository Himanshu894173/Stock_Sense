from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True


class LocationResponse(BaseModel):
    id: int
    warehouse_id: int
    name: str
    code: str
    class Config:
        from_attributes = True


class WarehouseResponse(BaseModel):
    id: int
    name: str
    code: str
    address: Optional[str] = None
    locations: List[LocationResponse] = []
    class Config:
        from_attributes = True


class StockBalanceResponse(BaseModel):
    id: int
    location_id: int
    location_name: str
    warehouse_name: str
    quantity: float
    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: int
    unit_of_measure: str = "Units"
    reorder_level: float = 10.0
    initial_stock: Optional[float] = 0.0
    initial_location_id: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    unit_of_measure: Optional[str] = None
    reorder_level: Optional[float] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    category_id: int
    category_name: str
    unit_of_measure: str
    reorder_level: float
    total_stock: float
    stock_status: str  # "In Stock", "Low Stock", "Out of Stock"
    is_active: bool
    created_at: datetime
    balances: List[StockBalanceResponse] = []

    class Config:
        from_attributes = True
