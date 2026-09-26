from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ItemCreate(BaseModel):
    product_id: int
    quantity: float

class ItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    unit_of_measure: str
    quantity: float

    class Config:
        from_attributes = True

# Receipt Schemas
class ReceiptCreate(BaseModel):
    supplier_id: Optional[int] = None
    destination_location_id: int
    notes: Optional[str] = None
    items: List[ItemCreate]

class ReceiptResponse(BaseModel):
    id: int
    reference_no: str
    supplier_name: Optional[str] = None
    destination_location_id: int
    destination_location_name: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    validated_at: Optional[datetime] = None
    items: List[ItemResponse] = []

    class Config:
        from_attributes = True


# Delivery Order Schemas
class DeliveryCreate(BaseModel):
    customer_name: Optional[str] = None
    source_location_id: int
    notes: Optional[str] = None
    items: List[ItemCreate]

class DeliveryResponse(BaseModel):
    id: int
    reference_no: str
    customer_name: Optional[str] = None
    source_location_id: int
    source_location_name: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    validated_at: Optional[datetime] = None
    items: List[ItemResponse] = []

    class Config:
        from_attributes = True


# Internal Transfer Schemas
class TransferCreate(BaseModel):
    source_location_id: int
    destination_location_id: int
    notes: Optional[str] = None
    items: List[ItemCreate]

class TransferResponse(BaseModel):
    id: int
    reference_no: str
    source_location_id: int
    source_location_name: str
    destination_location_id: int
    destination_location_name: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    validated_at: Optional[datetime] = None
    items: List[ItemResponse] = []

    class Config:
        from_attributes = True


# Inventory Adjustment Schemas
class AdjustmentCreate(BaseModel):
    product_id: int
    location_id: int
    counted_quantity: float
    reason: str  # Damaged, Lost, Found, Counting Error, Other
    notes: Optional[str] = None

class AdjustmentResponse(BaseModel):
    id: int
    reference_no: str
    product_id: int
    product_name: str
    product_sku: str
    location_id: int
    location_name: str
    recorded_quantity: float
    counted_quantity: float
    difference: float
    reason: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
