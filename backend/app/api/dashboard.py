from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from app.database import get_db
from app.models.product import Product, Category, StockBalance, Location, Warehouse
from app.models.operations import (
    Receipt, DeliveryOrder, InternalTransfer, InventoryAdjustment, DocumentStatus
)
from app.models.ledger import StockLedger

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    products = db.query(Product).filter(Product.is_active == True).all()

    total_products = len(products)
    low_stock_count = 0
    out_of_stock_count = 0
    low_stock_items = []

    for p in products:
        balances = db.query(StockBalance).filter(StockBalance.product_id == p.id).all()
        total_qty = sum(b.quantity for b in balances)
        cat = db.query(Category).get(p.category_id)

        if total_qty == 0:
            out_of_stock_count += 1
            low_stock_items.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "total_stock": total_qty,
                "reorder_level": p.reorder_level,
                "category_name": cat.name if cat else "N/A",
                "status": "Out of Stock"
            })
        elif total_qty <= p.reorder_level:
            low_stock_count += 1
            low_stock_items.append({
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "total_stock": total_qty,
                "reorder_level": p.reorder_level,
                "category_name": cat.name if cat else "N/A",
                "status": "Low Stock"
            })

    # Pending operation counts calculated strictly from database
    pending_receipts = db.query(Receipt).filter(
        Receipt.status.in_([DocumentStatus.DRAFT.value, DocumentStatus.WAITING.value])
    ).count()

    pending_deliveries = db.query(DeliveryOrder).filter(
        DeliveryOrder.status.in_([DocumentStatus.DRAFT.value, DocumentStatus.WAITING.value])
    ).count()

    scheduled_transfers = db.query(InternalTransfer).filter(
        InternalTransfer.status.in_([DocumentStatus.DRAFT.value, DocumentStatus.WAITING.value])
    ).count()

    # Stock by Category
    categories = db.query(Category).all()
    category_data = []
    for c in categories:
        cat_products = db.query(Product).filter(Product.category_id == c.id).all()
        cat_total_qty = 0
        for cp in cat_products:
            b_list = db.query(StockBalance).filter(StockBalance.product_id == cp.id).all()
            cat_total_qty += sum(b.quantity for b in b_list)
        category_data.append({
            "category_name": c.name,
            "product_count": len(cat_products),
            "total_quantity": cat_total_qty
        })

    # Recent Activities from Stock Ledger
    recent_ledger = db.query(StockLedger).order_by(StockLedger.id.desc()).limit(10).all()
    recent_activities = []
    for l in recent_ledger:
        prod = db.query(Product).get(l.product_id)
        recent_activities.append({
            "id": l.id,
            "timestamp": l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "product_name": prod.name if prod else "Product",
            "movement_type": l.movement_type,
            "quantity": l.quantity,
            "reference_no": l.reference_no,
            "reason": l.reason
        })

    return {
        "kpis": {
            "total_products": total_products,
            "low_stock_items": low_stock_count,
            "out_of_stock_items": out_of_stock_count,
            "pending_receipts": pending_receipts,
            "pending_deliveries": pending_deliveries,
            "scheduled_transfers": scheduled_transfers
        },
        "low_stock_products": low_stock_items,
        "category_distribution": category_data,
        "recent_activities": recent_activities
    }
