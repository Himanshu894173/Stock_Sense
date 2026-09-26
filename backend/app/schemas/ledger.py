from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StockLedgerResponse(BaseModel):
    id: int
    timestamp: datetime
    product_id: int
    product_name: str
    product_sku: str
    movement_type: str
    source_location_id: Optional[int] = None
    source_location_name: Optional[str] = None
    destination_location_id: Optional[int] = None
    destination_location_name: Optional[str] = None
    quantity: float
    quantity_before: float
    quantity_after: float
    reference_no: str
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True
