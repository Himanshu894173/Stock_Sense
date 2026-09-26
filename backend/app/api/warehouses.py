from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.product import Warehouse, Location
from app.schemas.product import WarehouseResponse, LocationResponse
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/warehouses", tags=["Warehouses"])

class WarehouseCreate(BaseModel):
    name: str
    code: str
    address: str = None

class LocationCreate(BaseModel):
    warehouse_id: int
    name: str
    code: str

@router.get("", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.post("", response_model=WarehouseResponse)
def create_warehouse(wh_in: WarehouseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(Warehouse).filter((Warehouse.name == wh_in.name) | (Warehouse.code == wh_in.code)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse name or code already exists")
    wh = Warehouse(name=wh_in.name, code=wh_in.code, address=wh_in.address)
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh

@router.get("/locations", response_model=List[LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()

@router.post("/locations", response_model=LocationResponse)
def create_location(loc_in: LocationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    wh = db.query(Warehouse).filter(Warehouse.id == loc_in.warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    loc = Location(warehouse_id=loc_in.warehouse_id, name=loc_in.name, code=loc_in.code)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc
