import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operations import Receipt, ReceiptItem, Supplier, DocumentStatus
from app.models.product import Product, Location
from app.schemas.operation import ReceiptCreate, ReceiptResponse
from app.services.stock_service import StockEngine
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/receipts", tags=["Receipts"])

def format_receipt_response(r: Receipt, db: Session) -> ReceiptResponse:
    loc = db.query(Location).get(r.destination_location_id)
    sup = db.query(Supplier).get(r.supplier_id) if r.supplier_id else None

    items = []
    for item in r.items:
        prod = db.query(Product).get(item.product_id)
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": prod.name if prod else "Unknown",
            "product_sku": prod.sku if prod else "N/A",
            "unit_of_measure": prod.unit_of_measure if prod else "Units",
            "quantity": item.quantity
        })

    return ReceiptResponse(
        id=r.id,
        reference_no=r.reference_no,
        supplier_name=sup.name if sup else "Direct Vendor",
        destination_location_id=r.destination_location_id,
        destination_location_name=loc.name if loc else "Unknown",
        status=r.status,
        notes=r.notes,
        created_at=r.created_at,
        validated_at=r.validated_at,
        items=items
    )

@router.get("", response_model=List[ReceiptResponse])
def list_receipts(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Receipt)
    if status:
        query = query.filter(Receipt.status == status)
    receipts = query.order_by(Receipt.id.desc()).all()
    return [format_receipt_response(r, db) for r in receipts]

@router.post("", response_model=ReceiptResponse)
def create_receipt(r_in: ReceiptCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    count = db.query(Receipt).count() + 1
    ref_no = f"REC-{datetime.datetime.utcnow().strftime('%Y')}-{count:04d}"

    receipt = Receipt(
        reference_no=ref_no,
        supplier_id=r_in.supplier_id,
        destination_location_id=r_in.destination_location_id,
        status=DocumentStatus.DRAFT.value,
        notes=r_in.notes,
        created_by_user_id=user.id
    )
    db.add(receipt)
    db.flush()

    for item_in in r_in.items:
        if item_in.quantity <= 0:
            raise HTTPException(status_code=400, detail="Item quantity must be greater than 0")
        item = ReceiptItem(
            receipt_id=receipt.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity
        )
        db.add(item)

    db.commit()
    db.refresh(receipt)
    return format_receipt_response(receipt, db)

@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    receipt = db.query(Receipt).get(receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return format_receipt_response(receipt, db)

@router.post("/{receipt_id}/validate", response_model=ReceiptResponse)
def validate_receipt(receipt_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    receipt = StockEngine.validate_receipt(db=db, receipt_id=receipt_id, user_id=user.id)
    return format_receipt_response(receipt, db)

@router.post("/{receipt_id}/cancel")
def cancel_receipt(receipt_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    receipt = db.query(Receipt).get(receipt_id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    if receipt.status == DocumentStatus.DONE.value:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed receipt")
    receipt.status = DocumentStatus.CANCELED.value
    db.commit()
    return {"success": True, "message": "Receipt canceled successfully"}
