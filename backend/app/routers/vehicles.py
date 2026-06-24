from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle import Vehicle
from app.models.member import Member
from app.models.unit import Unit
from app.models.user import User
from app.dependencies import get_current_user, get_resident_member
from app.schemas.vehicle import VehicleCreate, VehicleResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("/", response_model=list[VehicleResponse])
def list_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Vehicle, Member.name, Unit.unit_number)\
        .join(Member, Vehicle.member_id == Member.id)\
        .outerjoin(Unit, Member.unit_id == Unit.id)

    if current_user.role == "admin":
        if not current_user.building_id:
            return []
        results = query.filter(Unit.building_id == current_user.building_id).all()
    elif current_user.role == "resident":
        member = get_resident_member(db, current_user)
        if not member:
            return []
        results = query.filter(Vehicle.member_id == member.id).all()
    else:
        # super_admin can see all
        results = query.all()

    return [
        VehicleResponse(
            id=v.id,
            member_id=v.member_id,
            license_plate=v.license_plate,
            make_model=v.make_model,
            color=v.color,
            created_at=v.created_at,
            updated_at=v.updated_at,
            member_name=m_name,
            unit_number=u_num
        )
        for v, m_name, u_num in results
    ]


@router.post("/", response_model=VehicleResponse, status_code=201)
def create_vehicle(
    body: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clean_plate = body.license_plate.strip().upper()
    if not clean_plate:
        raise HTTPException(status_code=400, detail="License plate cannot be empty")

    existing = db.query(Vehicle).filter(Vehicle.license_plate == clean_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail="A vehicle with this license plate is already registered")

    if current_user.role == "admin":
        if not current_user.building_id:
            raise HTTPException(status_code=400, detail="Admin not associated with a building")
        if not body.member_id:
            raise HTTPException(status_code=400, detail="member_id is required for admins")
        member = db.query(Member).filter(Member.id == body.member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        if member.unit_id:
            unit = db.query(Unit).filter(Unit.id == member.unit_id).first()
            if unit and unit.building_id != current_user.building_id:
                raise HTTPException(status_code=403, detail="Member does not belong to your building")
        member_id = member.id
    else:
        member = get_resident_member(db, current_user)
        if not member:
            raise HTTPException(status_code=403, detail="No member profile linked to this account")
        member_id = member.id

    vehicle = Vehicle(
        member_id=member_id,
        license_plate=clean_plate,
        make_model=body.make_model,
        color=body.color,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    # Log audit
    log_audit(
        db=db,
        action="create_vehicle",
        entity_type="vehicle",
        user_id=current_user.id,
        entity_id=vehicle.id,
        details=f"Registered vehicle {vehicle.make_model} ({vehicle.license_plate})"
    )

    # Fetch associated names for response
    m_name = db.query(Member.name).filter(Member.id == member_id).scalar() or "Unknown"
    u_num = None
    if member and member.unit_id:
        u_num = db.query(Unit.unit_number).filter(Unit.id == member.unit_id).scalar()

    return VehicleResponse(
        id=vehicle.id,
        member_id=vehicle.member_id,
        license_plate=vehicle.license_plate,
        make_model=vehicle.make_model,
        color=vehicle.color,
        created_at=vehicle.created_at,
        updated_at=vehicle.updated_at,
        member_name=m_name,
        unit_number=u_num
    )


@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # Authorization
    if current_user.role == "admin":
        if not current_user.building_id:
            raise HTTPException(status_code=400, detail="Admin not associated with a building")
        # Check building scope of the vehicle's member
        member = db.query(Member).filter(Member.id == vehicle.member_id).first()
        if member and member.unit_id:
            unit = db.query(Unit).filter(Unit.id == member.unit_id).first()
            if unit and unit.building_id != current_user.building_id:
                raise HTTPException(status_code=403, detail="Vehicle does not belong to your building")
    elif current_user.role == "resident":
        member = get_resident_member(db, current_user)
        if not member or vehicle.member_id != member.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this vehicle")
    else:
        # super_admin can do everything
        pass

    db.delete(vehicle)
    db.commit()

    log_audit(
        db=db,
        action="delete_vehicle",
        entity_type="vehicle",
        user_id=current_user.id,
        entity_id=vehicle_id,
        details=f"Deleted vehicle {vehicle.make_model} ({vehicle.license_plate})"
    )
