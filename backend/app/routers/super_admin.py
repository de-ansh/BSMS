from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.building import Building
from app.models.unit import Unit
from app.models.user import User
from app.dependencies import get_current_user
from app.schemas.building import (
    AdminStatusUpdate,
    BuildingAdminCreate,
    BuildingAdminResponse,
    BuildingCreate,
    BuildingResponse,
    BuildingUpdate,
)
from app.services.auth import hash_password
from app.services.building_scope import get_building_or_404

router = APIRouter(prefix="/super-admin", tags=["super-admin"])


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return current_user


def _building_response(db: Session, building: Building) -> BuildingResponse:
    admin_count = (
        db.query(User)
        .filter(User.building_id == building.id, User.role == "admin")
        .count()
    )
    unit_count = db.query(Unit).filter(Unit.building_id == building.id).count()
    return BuildingResponse(
        id=str(building.id),
        name=building.name,
        code=building.code,
        address=building.address,
        city=building.city,
        state=building.state,
        postal_code=building.postal_code,
        is_active=building.is_active,
        created_at=building.created_at,
        admin_count=admin_count,
        unit_count=unit_count,
    )


@router.get("/buildings", response_model=list[BuildingResponse])
def list_buildings(
    db: Session = Depends(get_db),
    _user: User = Depends(require_super_admin),
):
    buildings = db.query(Building).order_by(Building.name).all()
    return [_building_response(db, b) for b in buildings]


@router.post("/buildings", response_model=BuildingResponse, status_code=201)
def create_building(
    body: BuildingCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_super_admin),
):
    code = body.code.lower().strip()
    if db.query(Building).filter(Building.code == code).first():
        raise HTTPException(status_code=400, detail="Building code already exists")

    building = Building(
        name=body.name.strip(),
        code=code,
        address=body.address,
        city=body.city,
        state=body.state,
        postal_code=body.postal_code,
        is_active=True,
    )
    db.add(building)
    db.commit()
    db.refresh(building)
    return _building_response(db, building)


@router.get("/buildings/{building_id}", response_model=BuildingResponse)
def get_building(
    building_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_super_admin),
):
    building = get_building_or_404(db, building_id)
    return _building_response(db, building)


@router.patch("/buildings/{building_id}", response_model=BuildingResponse)
def update_building(
    building_id: str,
    body: BuildingUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_super_admin),
):
    building = get_building_or_404(db, building_id)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(building, key, value)
    db.commit()
    db.refresh(building)
    return _building_response(db, building)


@router.get("/buildings/{building_id}/admins", response_model=list[BuildingAdminResponse])
def list_building_admins(
    building_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_super_admin),
):
    get_building_or_404(db, building_id)
    admins = (
        db.query(User)
        .filter(User.building_id == building_id, User.role == "admin")
        .order_by(User.name)
        .all()
    )
    return admins


@router.post(
    "/buildings/{building_id}/admins",
    response_model=BuildingAdminResponse,
    status_code=201,
)
def create_building_admin(
    building_id: str,
    body: BuildingAdminCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_super_admin),
):
    building = get_building_or_404(db, building_id)
    if not building.is_active:
        raise HTTPException(status_code=400, detail="Cannot add admins to a disabled building")

    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    admin = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        name=body.name.strip(),
        role="admin",
        building_id=building_id,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


@router.patch("/admins/{user_id}", response_model=BuildingAdminResponse)
def set_admin_status(
    user_id: str,
    body: AdminStatusUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_super_admin),
):
    admin = db.query(User).filter(User.id == user_id, User.role == "admin").first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    admin.is_active = body.is_active
    db.commit()
    db.refresh(admin)
    return admin
