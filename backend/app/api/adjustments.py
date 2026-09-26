from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operations import InventoryAdjustment
from app.models.product import Product, Location
from app.schemas.operation import AdjustmentCreate, AdjustmentResponse
from app.services.stock_service import StockEngine
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/adjustments", tags=["Inventory Adjustments"])

def format_adjustment_response(a: InventoryAdjustment, db: Session) -> AdjustmentResponse:
    prod = db.query(Product).get(a.product_id)
    loc = db.query(Location).get(a.location_id)

    return AdjustmentResponse(
        id=a.id,
        reference_no=a.reference_no,
        product_id=a.product_id,
        product_name=prod.name if prod else "Unknown",
        product_sku=prod.sku if prod else "N/A",
        location_id=a.location_id,
        location_name=loc.name if loc else "Unknown",
        recorded_quantity=a.recorded_quantity,
        counted_quantity=a.counted_quantity,
        difference=a.difference,
        reason=a.reason,
        notes=a.notes,
        created_at=a.created_at
    )

@router.get("", response_model=List[AdjustmentResponse])
def list_adjustments(db: Session = Depends(get_db)):
    adjustments = db.query(InventoryAdjustment).order_by(InventoryAdjustment.id.desc()).all()
    return [format_adjustment_response(a, db) for a in adjustments]

@router.post("", response_model=AdjustmentResponse)
def create_adjustment(adj_in: AdjustmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    adjustment = StockEngine.create_adjustment(
        db=db,
        product_id=adj_in.product_id,
        location_id=adj_in.location_id,
        counted_quantity=adj_in.counted_quantity,
        reason=adj_in.reason,
        user_id=user.id,
        notes=adj_in.notes
    )
    return format_adjustment_response(adjustment, db)
