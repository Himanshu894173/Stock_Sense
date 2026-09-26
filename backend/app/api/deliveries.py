import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operations import DeliveryOrder, DeliveryItem, DocumentStatus
from app.models.product import Product, Location
from app.schemas.operation import DeliveryCreate, DeliveryResponse
from app.services.stock_service import StockEngine
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/deliveries", tags=["Delivery Orders"])

def format_delivery_response(d: DeliveryOrder, db: Session) -> DeliveryResponse:
    loc = db.query(Location).get(d.source_location_id)

    items = []
    for item in d.items:
        prod = db.query(Product).get(item.product_id)
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": prod.name if prod else "Unknown",
            "product_sku": prod.sku if prod else "N/A",
            "unit_of_measure": prod.unit_of_measure if prod else "Units",
            "quantity": item.quantity
        })

    return DeliveryResponse(
        id=d.id,
        reference_no=d.reference_no,
        customer_name=d.customer_name or "Standard Shipment",
        source_location_id=d.source_location_id,
        source_location_name=loc.name if loc else "Unknown",
        status=d.status,
        notes=d.notes,
        created_at=d.created_at,
        validated_at=d.validated_at,
        items=items
    )

@router.get("", response_model=List[DeliveryResponse])
def list_deliveries(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(DeliveryOrder)
    if status:
        query = query.filter(DeliveryOrder.status == status)
    deliveries = query.order_by(DeliveryOrder.id.desc()).all()
    return [format_delivery_response(d, db) for d in deliveries]

@router.post("", response_model=DeliveryResponse)
def create_delivery(d_in: DeliveryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    count = db.query(DeliveryOrder).count() + 1
    ref_no = f"DEL-{datetime.datetime.utcnow().strftime('%Y')}-{count:04d}"

    delivery = DeliveryOrder(
        reference_no=ref_no,
        customer_name=d_in.customer_name,
        source_location_id=d_in.source_location_id,
        status=DocumentStatus.DRAFT.value,
        notes=d_in.notes,
        created_by_user_id=user.id
    )
    db.add(delivery)
    db.flush()

    for item_in in d_in.items:
        if item_in.quantity <= 0:
            raise HTTPException(status_code=400, detail="Item quantity must be greater than 0")
        item = DeliveryItem(
            delivery_id=delivery.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity
        )
        db.add(item)

    db.commit()
    db.refresh(delivery)
    return format_delivery_response(delivery, db)

@router.get("/{delivery_id}", response_model=DeliveryResponse)
def get_delivery(delivery_id: int, db: Session = Depends(get_db)):
    delivery = db.query(DeliveryOrder).get(delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery order not found")
    return format_delivery_response(delivery, db)

@router.post("/{delivery_id}/validate", response_model=DeliveryResponse)
def validate_delivery(delivery_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    delivery = StockEngine.validate_delivery(db=db, delivery_id=delivery_id, user_id=user.id)
    return format_delivery_response(delivery, db)

@router.post("/{delivery_id}/cancel")
def cancel_delivery(delivery_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    delivery = db.query(DeliveryOrder).get(delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery order not found")
    if delivery.status == DocumentStatus.DONE.value:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed delivery order")
    delivery.status = DocumentStatus.CANCELED.value
    db.commit()
    return {"success": True, "message": "Delivery order canceled successfully"}
