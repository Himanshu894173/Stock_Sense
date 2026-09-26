import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.product import StockBalance, Product, Location
from app.models.operations import (
    Receipt, DeliveryOrder, InternalTransfer, InventoryAdjustment, DocumentStatus
)
from app.models.ledger import StockLedger, MovementType

class StockEngine:

    @staticmethod
    def get_or_create_balance(db: Session, product_id: int, location_id: int) -> StockBalance:
        balance = db.query(StockBalance).filter(
            StockBalance.product_id == product_id,
            StockBalance.location_id == location_id
        ).first()
        if not balance:
            balance = StockBalance(product_id=product_id, location_id=location_id, quantity=0.0)
            db.add(balance)
            db.flush()
        return balance

    @classmethod
    def validate_receipt(cls, db: Session, receipt_id: int, user_id: int = None) -> Receipt:
        receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        if receipt.status == DocumentStatus.DONE.value:
            raise HTTPException(status_code=400, detail="Receipt is already validated/completed")
        if receipt.status == DocumentStatus.CANCELED.value:
            raise HTTPException(status_code=400, detail="Cannot validate a canceled receipt")

        for item in receipt.items:
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid quantity {item.quantity} for product ID {item.product_id}")
            
            balance = cls.get_or_create_balance(db, item.product_id, receipt.destination_location_id)
            qty_before = balance.quantity
            balance.quantity += item.quantity
            qty_after = balance.quantity

            # Create Stock Ledger Record
            ledger = StockLedger(
                timestamp=datetime.datetime.utcnow(),
                product_id=item.product_id,
                movement_type=MovementType.RECEIPT.value,
                destination_location_id=receipt.destination_location_id,
                quantity=item.quantity,
                quantity_before=qty_before,
                quantity_after=qty_after,
                reference_no=receipt.reference_no,
                user_id=user_id,
                reason="Vendor Receipt"
            )
            db.add(ledger)

        receipt.status = DocumentStatus.DONE.value
        receipt.validated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(receipt)
        return receipt

    @classmethod
    def validate_delivery(cls, db: Session, delivery_id: int, user_id: int = None) -> DeliveryOrder:
        delivery = db.query(DeliveryOrder).filter(DeliveryOrder.id == delivery_id).first()
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery order not found")
        
        if delivery.status == DocumentStatus.DONE.value:
            raise HTTPException(status_code=400, detail="Delivery order is already completed")
        if delivery.status == DocumentStatus.CANCELED.value:
            raise HTTPException(status_code=400, detail="Cannot validate a canceled delivery order")

        # Step 1: Strict Insufficient Stock Check across all items first
        for item in delivery.items:
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid delivery quantity {item.quantity}")
            
            balance = cls.get_or_create_balance(db, item.product_id, delivery.source_location_id)
            if balance.quantity < item.quantity:
                product = db.query(Product).get(item.product_id)
                location = db.query(Location).get(delivery.source_location_id)
                p_name = product.name if product else f"ID {item.product_id}"
                l_name = location.name if location else f"ID {delivery.source_location_id}"
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{p_name}' at location '{l_name}'. Available: {balance.quantity}, Requested: {item.quantity}"
                )

        # Step 2: Atomic Deduction & Audit Logging
        for item in delivery.items:
            balance = cls.get_or_create_balance(db, item.product_id, delivery.source_location_id)
            qty_before = balance.quantity
            balance.quantity -= item.quantity
            qty_after = balance.quantity

            ledger = StockLedger(
                timestamp=datetime.datetime.utcnow(),
                product_id=item.product_id,
                movement_type=MovementType.DELIVERY.value,
                source_location_id=delivery.source_location_id,
                quantity=-item.quantity,
                quantity_before=qty_before,
                quantity_after=qty_after,
                reference_no=delivery.reference_no,
                user_id=user_id,
                reason="Customer Shipment"
            )
            db.add(ledger)

        delivery.status = DocumentStatus.DONE.value
        delivery.validated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(delivery)
        return delivery

    @classmethod
    def validate_transfer(cls, db: Session, transfer_id: int, user_id: int = None) -> InternalTransfer:
        transfer = db.query(InternalTransfer).filter(InternalTransfer.id == transfer_id).first()
        if not transfer:
            raise HTTPException(status_code=404, detail="Internal transfer not found")
        
        if transfer.status == DocumentStatus.DONE.value:
            raise HTTPException(status_code=400, detail="Transfer is already completed")
        if transfer.status == DocumentStatus.CANCELED.value:
            raise HTTPException(status_code=400, detail="Cannot validate a canceled transfer")

        if transfer.source_location_id == transfer.destination_location_id:
            raise HTTPException(status_code=400, detail="Source and destination locations cannot be identical")

        # Step 1: Verify source stock for all items
        for item in transfer.items:
            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid transfer quantity {item.quantity}")
            
            source_balance = cls.get_or_create_balance(db, item.product_id, transfer.source_location_id)
            if source_balance.quantity < item.quantity:
                product = db.query(Product).get(item.product_id)
                location = db.query(Location).get(transfer.source_location_id)
                p_name = product.name if product else f"ID {item.product_id}"
                l_name = location.name if location else f"ID {transfer.source_location_id}"
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for '{p_name}' at source location '{l_name}'. Available: {source_balance.quantity}, Requested: {item.quantity}"
                )

        # Step 2: Atomic Transfer (Deduct source, Add destination)
        for item in transfer.items:
            source_balance = cls.get_or_create_balance(db, item.product_id, transfer.source_location_id)
            dest_balance = cls.get_or_create_balance(db, item.product_id, transfer.destination_location_id)

            src_before = source_balance.quantity
            source_balance.quantity -= item.quantity
            src_after = source_balance.quantity

            dest_before = dest_balance.quantity
            dest_balance.quantity += item.quantity
            dest_after = dest_balance.quantity

            ledger = StockLedger(
                timestamp=datetime.datetime.utcnow(),
                product_id=item.product_id,
                movement_type=MovementType.TRANSFER.value,
                source_location_id=transfer.source_location_id,
                destination_location_id=transfer.destination_location_id,
                quantity=item.quantity,
                quantity_before=src_before,
                quantity_after=src_after,
                reference_no=transfer.reference_no,
                user_id=user_id,
                reason="Internal Relocation"
            )
            db.add(ledger)

        transfer.status = DocumentStatus.DONE.value
        transfer.validated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(transfer)
        return transfer

    @classmethod
    def create_adjustment(
        cls,
        db: Session,
        product_id: int,
        location_id: int,
        counted_quantity: float,
        reason: str,
        user_id: int = None,
        notes: str = None
    ) -> InventoryAdjustment:
        if counted_quantity < 0:
            raise HTTPException(status_code=400, detail="Counted physical quantity cannot be negative")

        balance = cls.get_or_create_balance(db, product_id, location_id)
        recorded_quantity = balance.quantity
        difference = counted_quantity - recorded_quantity

        # Create Adjustment document reference
        ref_count = db.query(InventoryAdjustment).count() + 1
        ref_no = f"ADJ-{datetime.datetime.utcnow().strftime('%Y')}-{ref_count:04d}"

        adjustment = InventoryAdjustment(
            reference_no=ref_no,
            product_id=product_id,
            location_id=location_id,
            recorded_quantity=recorded_quantity,
            counted_quantity=counted_quantity,
            difference=difference,
            reason=reason,
            notes=notes,
            created_by_user_id=user_id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(adjustment)

        # Update Stock Balance directly
        balance.quantity = counted_quantity

        # Record Ledger Entry
        ledger = StockLedger(
            timestamp=datetime.datetime.utcnow(),
            product_id=product_id,
            movement_type=MovementType.ADJUSTMENT.value,
            destination_location_id=location_id,
            quantity=difference,
            quantity_before=recorded_quantity,
            quantity_after=counted_quantity,
            reference_no=ref_no,
            user_id=user_id,
            reason=f"Stock Audit ({reason})"
        )
        db.add(ledger)

        db.commit()
        db.refresh(adjustment)
        return adjustment
