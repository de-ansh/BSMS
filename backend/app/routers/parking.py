from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.parking import ParkingSlot
from app.models.unit import Unit
from app.models.user import User
from app.dependencies import get_current_user, get_resident_member, require_admin
from app.schemas.parking import (
    ParkingSlotCreate,
    ParkingSlotResponse,
    ParkingSlotAllocate,
    ParkingSlotStatusUpdate,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/parking", tags=["parking"])


@router.get("/slots", response_model=list[ParkingSlotResponse])
def list_slots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    building_id = None
    if current_user.role in ("admin", "super_admin"):
        building_id = current_user.building_id
    elif current_user.role == "resident":
        member = get_resident_member(db, current_user)
        if member and member.unit_id:
            unit = db.query(Unit).filter(Unit.id == member.unit_id).first()
            if unit:
                building_id = unit.building_id

    # If super_admin is not scoped to building, or if resident has no building
    if not building_id:
        if current_user.role == "super_admin":
            # super admin can see all slots across all buildings
            query = db.query(ParkingSlot, Unit.unit_number).outerjoin(Unit, ParkingSlot.unit_id == Unit.id)
            results = query.order_by(ParkingSlot.slot_number).all()
            return [
                ParkingSlotResponse(
                    id=slot.id,
                    building_id=slot.building_id,
                    unit_id=slot.unit_id,
                    slot_number=slot.slot_number,
                    status=slot.status,
                    created_at=slot.created_at,
                    updated_at=slot.updated_at,
                    unit_number=unit_number
                )
                for slot, unit_number in results
            ]
        return []

    query = db.query(ParkingSlot, Unit.unit_number)\
        .outerjoin(Unit, ParkingSlot.unit_id == Unit.id)\
        .filter(ParkingSlot.building_id == building_id)

    results = query.order_by(ParkingSlot.slot_number).all()
    return [
        ParkingSlotResponse(
            id=slot.id,
            building_id=slot.building_id,
            unit_id=slot.unit_id,
            slot_number=slot.slot_number,
            status=slot.status,
            created_at=slot.created_at,
            updated_at=slot.updated_at,
            unit_number=unit_number
        )
        for slot, unit_number in results
    ]


@router.post("/slots", response_model=ParkingSlotResponse, status_code=201)
def create_slot(
    body: ParkingSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if not current_user.building_id:
        raise HTTPException(status_code=400, detail="Admin not associated with a building")

    clean_slot_number = body.slot_number.strip()
    if not clean_slot_number:
        raise HTTPException(status_code=400, detail="Slot number cannot be empty")

    existing = db.query(ParkingSlot).filter(
        ParkingSlot.building_id == current_user.building_id,
        ParkingSlot.slot_number == clean_slot_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Parking slot number already exists")

    slot = ParkingSlot(
        building_id=current_user.building_id,
        slot_number=clean_slot_number,
        status=body.status or "available"
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    log_audit(
        db=db,
        action="create_parking_slot",
        entity_type="parking_slot",
        user_id=current_user.id,
        entity_id=slot.id,
        details=f"Created parking slot {slot.slot_number}"
    )

    return ParkingSlotResponse(
        id=slot.id,
        building_id=slot.building_id,
        unit_id=slot.unit_id,
        slot_number=slot.slot_number,
        status=slot.status,
        created_at=slot.created_at,
        updated_at=slot.updated_at,
        unit_number=None
    )


@router.patch("/slots/{slot_id}/allocate", response_model=ParkingSlotResponse)
def allocate_slot(
    slot_id: str,
    body: ParkingSlotAllocate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found")

    if slot.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Not authorized for this building's parking slots")

    unit_number = None
    if body.unit_id:
        unit = db.query(Unit).filter(Unit.id == body.unit_id).first()
        if not unit:
            raise HTTPException(status_code=404, detail="Unit not found")
        if unit.building_id != current_user.building_id:
            raise HTTPException(status_code=403, detail="Unit does not belong to your building")
        slot.unit_id = unit.id
        slot.status = "allocated"
        unit_number = unit.unit_number
    else:
        slot.unit_id = None
        slot.status = "available"

    db.commit()
    db.refresh(slot)

    log_audit(
        db=db,
        action="allocate_parking_slot",
        entity_type="parking_slot",
        user_id=current_user.id,
        entity_id=slot.id,
        details=f"Allocated parking slot {slot.slot_number} to unit {unit_number}" if unit_number else f"Deallocated parking slot {slot.slot_number}"
    )

    return ParkingSlotResponse(
        id=slot.id,
        building_id=slot.building_id,
        unit_id=slot.unit_id,
        slot_number=slot.slot_number,
        status=slot.status,
        created_at=slot.created_at,
        updated_at=slot.updated_at,
        unit_number=unit_number
    )


@router.patch("/slots/{slot_id}/status", response_model=ParkingSlotResponse)
def update_slot_status(
    slot_id: str,
    body: ParkingSlotStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Parking slot not found")

    if slot.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Not authorized for this building's parking slots")

    if body.status not in ("available", "allocated", "maintenance"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    slot.status = body.status
    if body.status == "available":
        slot.unit_id = None

    db.commit()
    db.refresh(slot)

    log_audit(
        db=db,
        action="update_parking_slot_status",
        entity_type="parking_slot",
        user_id=current_user.id,
        entity_id=slot.id,
        details=f"Updated parking slot {slot.slot_number} status to {slot.status}"
    )

    unit_number = None
    if slot.unit_id:
        unit_number = db.query(Unit.unit_number).filter(Unit.id == slot.unit_id).scalar()

    return ParkingSlotResponse(
        id=slot.id,
        building_id=slot.building_id,
        unit_id=slot.unit_id,
        slot_number=slot.slot_number,
        status=slot.status,
        created_at=slot.created_at,
        updated_at=slot.updated_at,
        unit_number=unit_number
    )
