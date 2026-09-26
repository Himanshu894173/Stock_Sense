import datetime
from sqlalchemy.orm import Session
import bcrypt

from app.database import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.product import Category, Warehouse, Location, Product, StockBalance
from app.models.operations import Supplier, Receipt, ReceiptItem, DeliveryOrder, DeliveryItem, InternalTransfer, TransferItem, DocumentStatus
from app.services.stock_service import StockEngine

def hash_pw(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    print("[SEED] Starting database seeding...")

    try:
        # 1. Users
        if db.query(User).count() == 0:
            manager = User(
                email="admin@stocksense.com",
                hashed_password=hash_pw("admin123"),
                full_name="Alex Mercer (Manager)",
                role=UserRole.MANAGER.value
            )
            staff = User(
                email="staff@stocksense.com",
                hashed_password=hash_pw("staff123"),
                full_name="Sam Taylor (Staff)",
                role=UserRole.STAFF.value
            )

            db.add_all([manager, staff])
            db.commit()
            print("  + Created users: admin@stocksense.com / staff@stocksense.com")
        
        manager_user = db.query(User).filter(User.role == UserRole.MANAGER.value).first()

        # 2. Categories
        if db.query(Category).count() == 0:
            cat_metals = Category(name="Raw Materials & Metals", description="Steel rods, aluminum, raw ingots")
            cat_furniture = Category(name="Finished Goods & Furniture", description="Office chairs, tables, desks")
            cat_electronics = Category(name="Electronics", description="Sensors, microcontrollers, circuits")
            cat_packaging = Category(name="Packaging Material", description="Cardboard boxes, bubble wrap")
            db.add_all([cat_metals, cat_furniture, cat_electronics, cat_packaging])
            db.commit()
            print("  + Created product categories")

        cat_metals = db.query(Category).filter(Category.name == "Raw Materials & Metals").first()
        cat_furniture = db.query(Category).filter(Category.name == "Finished Goods & Furniture").first()
        cat_electronics = db.query(Category).filter(Category.name == "Electronics").first()
        cat_packaging = db.query(Category).filter(Category.name == "Packaging Material").first()

        # 3. Warehouses & Locations
        if db.query(Warehouse).count() == 0:
            wh_main = Warehouse(name="Main Warehouse", code="MWH", address="100 Logistics Way")
            wh_prod = Warehouse(name="Production Plant", code="PRD", address="50 Manufacturing Blvd")
            wh_stg = Warehouse(name="Storage Depot", code="STG", address="12 Reserve St")
            db.add_all([wh_main, wh_prod, wh_stg])
            db.commit()

            loc_main_store = Location(warehouse_id=wh_main.id, name="Main Store", code="MWH-MS")
            loc_rack_a = Location(warehouse_id=wh_main.id, name="Rack A", code="MWH-RA")
            loc_rack_b = Location(warehouse_id=wh_main.id, name="Rack B", code="MWH-RB")

            loc_prod_rack = Location(warehouse_id=wh_prod.id, name="Production Rack", code="PRD-PR")
            loc_assembly = Location(warehouse_id=wh_prod.id, name="Assembly Line", code="PRD-AL")

            loc_storage_area = Location(warehouse_id=wh_stg.id, name="Storage Area", code="STG-SA")

            db.add_all([loc_main_store, loc_rack_a, loc_rack_b, loc_prod_rack, loc_assembly, loc_storage_area])
            db.commit()
            print("  + Created Warehouses & Locations")

        loc_main_store = db.query(Location).filter(Location.code == "MWH-MS").first()
        loc_rack_a = db.query(Location).filter(Location.code == "MWH-RA").first()
        loc_prod_rack = db.query(Location).filter(Location.code == "PRD-PR").first()
        loc_storage_area = db.query(Location).filter(Location.code == "STG-SA").first()

        # 4. Suppliers
        if db.query(Supplier).count() == 0:
            sup1 = Supplier(name="SteelCraft Industries", contact_person="John Steel", email="sales@steelcraft.com", phone="555-0199")
            sup2 = Supplier(name="Global Tech Supplies", contact_person="Elena Rostova", email="info@globaltech.com", phone="555-0244")
            sup3 = Supplier(name="Apex Packaging Solutions", contact_person="David Box", email="contact@apexpack.com", phone="555-0311")
            db.add_all([sup1, sup2, sup3])
            db.commit()
            print("  + Created suppliers")

        sup1 = db.query(Supplier).filter(Supplier.name == "SteelCraft Industries").first()
        sup2 = db.query(Supplier).filter(Supplier.name == "Global Tech Supplies").first()

        # 5. Products
        if db.query(Product).count() == 0:
            p_steel = Product(name="Steel Rods", sku="STL-ROD-100", category_id=cat_metals.id, unit_of_measure="kg", reorder_level=20.0)
            p_chairs = Product(name="Executive Wooden Chairs", sku="CHR-EXC-001", category_id=cat_furniture.id, unit_of_measure="Units", reorder_level=15.0)
            p_tables = Product(name="Workstation Tables", sku="TBL-WRK-002", category_id=cat_furniture.id, unit_of_measure="Units", reorder_level=10.0)
            p_mcu = Product(name="Microcontrollers & Sensors", sku="ELE-MCU-303", category_id=cat_electronics.id, unit_of_measure="Units", reorder_level=50.0)
            p_boxes = Product(name="Heavy Duty Cardboard Boxes", sku="PKG-BOX-500", category_id=cat_packaging.id, unit_of_measure="Boxes", reorder_level=100.0)

            db.add_all([p_steel, p_chairs, p_tables, p_mcu, p_boxes])
            db.commit()
            print("  + Created products")

        p_steel = db.query(Product).filter(Product.sku == "STL-ROD-100").first()
        p_chairs = db.query(Product).filter(Product.sku == "CHR-EXC-001").first()
        p_mcu = db.query(Product).filter(Product.sku == "ELE-MCU-303").first()

        # 6. Execute Scenario Flow (Page 16 Requirements)
        if db.query(Receipt).count() == 0:
            print("  [SCENARIO] Executing Page 16 Demonstration Inventory Scenario...")

            # STEP 1: Receive 100 kg Steel Rods into Main Store
            rec1 = Receipt(
                reference_no="REC-2026-0001",
                supplier_id=sup1.id,
                destination_location_id=loc_main_store.id,
                status=DocumentStatus.DRAFT.value,
                notes="Initial Bulk Supply of Steel Rods",
                created_by_user_id=manager_user.id
            )
            db.add(rec1)
            db.flush()
            db.add(ReceiptItem(receipt_id=rec1.id, product_id=p_steel.id, quantity=100.0))
            db.commit()
            
            # Validate Receipt 1 -> Stock becomes +100 at Main Store
            StockEngine.validate_receipt(db, rec1.id, manager_user.id)
            print("    Step 1 Complete: Received 100 kg Steel Rods -> Main Store stock = 100 kg")

            # STEP 2: Transfer 100 kg Steel Rods from Main Store -> Production Rack
            trf1 = InternalTransfer(
                reference_no="TRF-2026-0001",
                source_location_id=loc_main_store.id,
                destination_location_id=loc_prod_rack.id,
                status=DocumentStatus.DRAFT.value,
                notes="Relocating raw materials for production line",
                created_by_user_id=manager_user.id
            )
            db.add(trf1)
            db.flush()
            db.add(TransferItem(transfer_id=trf1.id, product_id=p_steel.id, quantity=100.0))
            db.commit()

            # Validate Transfer 1 -> Main Store = 0, Production Rack = 100
            StockEngine.validate_transfer(db, trf1.id, manager_user.id)
            print("    Step 2 Complete: Transferred 100 kg Steel Rods to Production Rack")

            # STEP 3: Deliver 20 kg Steel Rods from Production Rack
            del1 = DeliveryOrder(
                reference_no="DEL-2026-0001",
                customer_name="AeroTech Manufacturing Ltd",
                source_location_id=loc_prod_rack.id,
                status=DocumentStatus.DRAFT.value,
                notes="Dispatched 20kg raw steel for client project",
                created_by_user_id=manager_user.id
            )
            db.add(del1)
            db.flush()
            db.add(DeliveryItem(delivery_id=del1.id, product_id=p_steel.id, quantity=20.0))
            db.commit()

            # Validate Delivery 1 -> Production Rack stock = 80 kg
            StockEngine.validate_delivery(db, del1.id, manager_user.id)
            print("    Step 3 Complete: Delivered 20 kg Steel Rods -> Production Rack stock = 80 kg")

            # STEP 4: 3 kg Steel Rods damaged -> Inventory Adjustment (Physical count = 77 kg)
            StockEngine.create_adjustment(
                db=db,
                product_id=p_steel.id,
                location_id=loc_prod_rack.id,
                counted_quantity=77.0,
                reason="Damaged",
                user_id=manager_user.id,
                notes="3 kg steel damaged during transport on floor"
            )
            print("    Step 4 Complete: Inventory Adjustment (-3 kg damaged) -> Final stock = 77 kg")

            # Seed extra stock for Chairs and Microcontrollers to demonstrate full ERP features
            rec2 = Receipt(
                reference_no="REC-2026-0002",
                supplier_id=sup2.id,
                destination_location_id=loc_rack_a.id,
                status=DocumentStatus.DRAFT.value,
                notes="Office furniture shipment",
                created_by_user_id=manager_user.id
            )
            db.add(rec2)
            db.flush()
            db.add(ReceiptItem(receipt_id=rec2.id, product_id=p_chairs.id, quantity=100.0))
            db.add(ReceiptItem(receipt_id=rec2.id, product_id=p_mcu.id, quantity=15.0))  # Low stock item!
            db.commit()

            StockEngine.validate_receipt(db, rec2.id, manager_user.id)

            # Create a pending draft delivery order and draft receipt to show pending KPIs
            rec_draft = Receipt(
                reference_no="REC-2026-0003",
                supplier_id=sup1.id,
                destination_location_id=loc_main_store.id,
                status=DocumentStatus.WAITING.value,
                notes="Expected vendor delivery tomorrow",
                created_by_user_id=manager_user.id
            )
            del_draft = DeliveryOrder(
                reference_no="DEL-2026-0002",
                customer_name="Starlight Corp",
                source_location_id=loc_rack_a.id,
                status=DocumentStatus.WAITING.value,
                notes="Order scheduled for dispatch",
                created_by_user_id=manager_user.id
            )
            db.add_all([rec_draft, del_draft])
            db.commit()

            print("  + Additional sample receipts and draft orders created for rich dashboard metrics!")

        print("[SUCCESS] Database seeding successfully finished!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding error: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
