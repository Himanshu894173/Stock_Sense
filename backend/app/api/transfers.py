import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.operations import InternalTransfer, TransferItem, DocumentStatus
from app.models.product import Product, Location
from app.schemas.operation import TransferCreate, TransferResponse
from app.services.stock_service import StockEngine
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/transfers", tags=["Internal Transfers"])

def format_transfer_response(t: InternalTransfer, db: Session) -> TransferResponse:
    src_loc = db.query(Location).get(t.source_location_id)
    dest_loc = db.query(Location).get(t.destination_location_id)

    items = []
    for item in t.items:
        prod = db.query(Product).get(item.product_id)
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": prod.name if prod else "Unknown",
            "product_sku": prod.sku if prod else "N/A",
            "unit_of_measure": prod.unit_of_measure if prod else "Units",
            "quantity": item.quantity
        })

    return TransferResponse(
        id=t.id,
        reference_no=t.reference_no,
        source_location_id=t.source_location_id,
        source_location_name=src_loc.name if src_loc else "Unknown",
        destination_location_id=t.destination_location_id,
        destination_location_name=dest_loc.name if dest_loc else "Unknown",
        status=t.status,
        notes=t.notes,
        created_at=t.created_at,
        validated_at=t.validated_at,
        items=items
    )

@router.get("", response_model=List[TransferResponse])
def list_transfers(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(InternalTransfer)
    if status:
        query = query.filter(InternalTransfer.status == status)
    transfers = query.order_by(InternalTransfer.id.desc()).all()
    return [format_transfer_response(t, db) for t in transfers]

@router.post("", response_model=TransferResponse)
def create_transfer(t_in: TransferCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    count = db.query(InternalTransfer).count() + 1
    ref_no = f"TRF-{datetime.datetime.utcnow().strftime('%Y')}-{count:04d}"

    transfer = InternalTransfer(
        reference_no=ref_no,
        source_location_id=t_in.source_location_id,
        destination_location_id=t_in.destination_location_id,
        status=DocumentStatus.DRAFT.value,
        notes=t_in.notes,
        created_by_user_id=user.id
    )
    db.add(transfer)
    db.flush()

    for item_in in t_in.items:
        if item_in.quantity <= 0:
            raise HTTPException(status_code=400, detail="Item quantity must be greater than 0")
        item = TransferItem(
            transfer_id=transfer.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity
        )
        db.add(item)

    db.commit()
    db.refresh(transfer)
    return format_transfer_response(transfer, db)

@router.get("/{transfer_id}", response_model=TransferResponse)
def get_transfer(transfer_id: int, db: Session = Depends(get_db)):
    transfer = db.query(InternalTransfer).get(transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return format_transfer_response(transfer, db)

@router.post("/{transfer_id}/validate", response_model=TransferResponse)
def validate_transfer(transfer_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    transfer = StockEngine.validate_transfer(db=db, transfer_id=transfer_id, user_id=user.id)
    return format_transfer_response(transfer, db)

@router.post("/{transfer_id}/cancel")
def cancel_transfer(transfer_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    transfer = db.query(InternalTransfer).get(transfer_id)
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    if transfer.status == DocumentStatus.DONE.value:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed transfer")
    transfer.status = DocumentStatus.CANCELED.value
    db.commit()
    return {"success": True, "message": "Transfer canceled successfully"}
