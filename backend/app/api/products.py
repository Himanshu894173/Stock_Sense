from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.product import Product, Category, StockBalance, Location, Warehouse
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, CategoryResponse, CategoryCreate
)
from app.api.auth import get_current_user
from app.models.user import User
from app.services.stock_service import StockEngine

router = APIRouter(prefix="/api/products", tags=["Products"])

def format_product_response(p: Product, db: Session) -> ProductResponse:
    balances = db.query(StockBalance).filter(StockBalance.product_id == p.id).all()
    total_stock = sum(b.quantity for b in balances)
    
    if total_stock == 0:
        status = "Out of Stock"
    elif total_stock <= p.reorder_level:
        status = "Low Stock"
    else:
        status = "In Stock"

    formatted_balances = []
    for b in balances:
        loc = db.query(Location).filter(Location.id == b.location_id).first()
        wh = db.query(Warehouse).filter(Warehouse.id == loc.warehouse_id).first() if loc else None
        formatted_balances.append({
            "id": b.id,
            "location_id": b.location_id,
            "location_name": loc.name if loc else "Unknown",
            "warehouse_name": wh.name if wh else "Unknown",
            "quantity": b.quantity
        })

    cat = db.query(Category).filter(Category.id == p.category_id).first()

    return ProductResponse(
        id=p.id,
        name=p.name,
        sku=p.sku,
        category_id=p.category_id,
        category_name=cat.name if cat else "Uncategorized",
        unit_of_measure=p.unit_of_measure,
        reorder_level=p.reorder_level,
        total_stock=total_stock,
        stock_status=status,
        is_active=p.is_active,
        created_at=p.created_at,
        balances=formatted_balances
    )

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(Category).filter(Category.name == cat_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    cat = Category(name=cat_in.name, description=cat_in.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("", response_model=List[ProductResponse])
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    warehouse_id: Optional[int] = None,
    stock_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)

    if search:
        s = f"%{search}%"
        query = query.filter((Product.name.ilike(s)) | (Product.sku.ilike(s)))
    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = query.all()
    results = []
    
    for p in products:
        res = format_product_response(p, db)
        
        # Filter by stock status if provided
        if stock_status and res.stock_status.lower() != stock_status.lower():
            continue
            
        # Filter by warehouse if provided
        if warehouse_id:
            loc_ids = [l.id for l in db.query(Location).filter(Location.warehouse_id == warehouse_id).all()]
            has_wh_balance = any(b["location_id"] in loc_ids for b in res.balances)
            if not has_wh_balance:
                continue

        results.append(res)

    return results

@router.post("", response_model=ProductResponse)
def create_product(prod_in: ProductCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(Product).filter(Product.sku == prod_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{prod_in.sku}' already exists")

    product = Product(
        name=prod_in.name,
        sku=prod_in.sku,
        category_id=prod_in.category_id,
        unit_of_measure=prod_in.unit_of_measure,
        reorder_level=prod_in.reorder_level
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Initial stock if provided
    if prod_in.initial_stock and prod_in.initial_stock > 0 and prod_in.initial_location_id:
        StockEngine.create_adjustment(
            db=db,
            product_id=product.id,
            location_id=prod_in.initial_location_id,
            counted_quantity=prod_in.initial_stock,
            reason="Initial Stock Setup",
            user_id=user.id,
            notes="Opening Inventory"
        )

    return format_product_response(product, db)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return format_product_response(product, db)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    prod_in: ProductUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if prod_in.name is not None: product.name = prod_in.name
    if prod_in.sku is not None: product.sku = prod_in.sku
    if prod_in.category_id is not None: product.category_id = prod_in.category_id
    if prod_in.unit_of_measure is not None: product.unit_of_measure = prod_in.unit_of_measure
    if prod_in.reorder_level is not None: product.reorder_level = prod_in.reorder_level
    if prod_in.is_active is not None: product.is_active = prod_in.is_active

    db.commit()
    db.refresh(product)
    return format_product_response(product, db)
