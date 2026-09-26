from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ledger import StockLedger
from app.models.product import Product, Location
from app.models.user import User
from app.schemas.ledger import StockLedgerResponse

router = APIRouter(prefix="/api/ledger", tags=["Stock Ledger / Move History"])

def format_ledger_response(l: StockLedger, db: Session) -> StockLedgerResponse:
    prod = db.query(Product).get(l.product_id)
    src_loc = db.query(Location).get(l.source_location_id) if l.source_location_id else None
    dest_loc = db.query(Location).get(l.destination_location_id) if l.destination_location_id else None
    u = db.query(User).get(l.user_id) if l.user_id else None

    return StockLedgerResponse(
        id=l.id,
        timestamp=l.timestamp,
        product_id=l.product_id,
        product_name=prod.name if prod else "Unknown",
        product_sku=prod.sku if prod else "N/A",
        movement_type=l.movement_type,
        source_location_id=l.source_location_id,
        source_location_name=src_loc.name if src_loc else None,
        destination_location_id=l.destination_location_id,
        destination_location_name=dest_loc.name if dest_loc else None,
        quantity=l.quantity,
        quantity_before=l.quantity_before,
        quantity_after=l.quantity_after,
        reference_no=l.reference_no,
        user_id=l.user_id,
        user_name=u.full_name if u else "System",
        reason=l.reason
    )

@router.get("", response_model=List[StockLedgerResponse])
def list_stock_ledger(
    search: Optional[str] = None,
    product_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    location_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StockLedger)

    if product_id:
        query = query.filter(StockLedger.product_id == product_id)
    if movement_type:
        query = query.filter(StockLedger.movement_type == movement_type)
    if location_id:
        query = query.filter(
            (StockLedger.source_location_id == location_id) | 
            (StockLedger.destination_location_id == location_id)
        )
    if search:
        s = f"%{search}%"
        query = query.filter((StockLedger.reference_no.ilike(s)) | (StockLedger.reason.ilike(s)))

    ledger_entries = query.order_by(StockLedger.id.desc()).all()
    return [format_ledger_response(l, db) for l in ledger_entries]
