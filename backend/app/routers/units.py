from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.unit import Unit
from app.models.member import Member
from app.models.user import User
from app.dependencies import (
    assert_unit_access,
    get_current_user,
    get_resident_member,
    require_admin,
)
from app.schemas.unit import UnitCreate, UnitResponse, UnitUpdate
from app.services.building_scope import require_admin_building

router = APIRouter(prefix="/units", tags=["units"])


def _build_unit_response(db: Session, unit: Unit) -> UnitResponse:
    occupant_name = None
    if unit.occupant_id:
        member = db.query(Member).filter(Member.id == unit.occupant_id).first()
        occupant_name = member.name if member else None

    return UnitResponse(
        id=str(unit.id),
        unit_number=unit.unit_number,
        building_id=str(unit.building_id) if unit.building_id else None,
        building=unit.building,
        floor=unit.floor,
        bedrooms=unit.bedrooms,
        bathrooms=unit.bathrooms,
        area_sqft=unit.area_sqft,
        maintenance_fee=unit.maintenance_fee,
        status=unit.status,
        occupant_id=str(unit.occupant_id) if unit.occupant_id else None,
        occupant_name=occupant_name,
    )


def _units_query(db: Session, user: User):
    query = db.query(Unit)
    if user.role == "admin" and user.building_id:
        query = query.filter(Unit.building_id == user.building_id)
    return query.order_by(Unit.building, Unit.unit_number)


@router.get("/", response_model=list[UnitResponse])
def list_units(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "admin":
        units = _units_query(db, current_user).all()
        return [_build_unit_response(db, unit) for unit in units]

    member = get_resident_member(db, current_user)
    if member is None or not member.unit_id:
        return []

    unit = db.query(Unit).filter(Unit.id == member.unit_id).first()
    return [_build_unit_response(db, unit)] if unit else []


@router.get("/{unit_id}", response_model=UnitResponse)
def get_unit(
    unit_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_unit_access(unit_id, db, current_user)
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return _build_unit_response(db, unit)


@router.post("/", response_model=UnitResponse, status_code=201)
def create_unit(
    body: UnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    building = require_admin_building(current_user, db)
    building_id = building.id
    building_name = building.name

    if body.building_id and body.building_id != building_id:
        raise HTTPException(status_code=403, detail="Cannot create units for another building")

    unit = Unit(
        unit_number=body.unit_number,
        building_id=building_id,
        building=building_name,
        floor=body.floor,
        bedrooms=body.bedrooms,
        bathrooms=body.bathrooms,
        area_sqft=body.area_sqft,
        maintenance_fee=body.maintenance_fee,
        status=body.status,
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return _build_unit_response(db, unit)


@router.put("/{unit_id}", response_model=UnitResponse)
def update_unit(
    unit_id: str,
    body: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    if current_user.building_id and unit.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = body.model_dump(exclude_unset=True)
    if "building_id" in update_data:
        update_data.pop("building_id")
    if "building" in update_data:
        update_data.pop("building")

    for key, value in update_data.items():
        setattr(unit, key, value)

    db.commit()
    db.refresh(unit)
    return _build_unit_response(db, unit)
