from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.staff import Staff
from app.models.user import User
from app.dependencies import require_admin
from app.schemas.staff import StaffCreate, StaffResponse, StaffUpdate

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("/", response_model=list[StaffResponse])
def list_staff(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    return db.query(Staff).order_by(Staff.name).all()


@router.get("/{staff_id}", response_model=StaffResponse)
def get_staff(
    staff_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff


@router.post("/", response_model=StaffResponse, status_code=201)
def create_staff(
    body: StaffCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    staff = Staff(
        name=body.name,
        email=body.email,
        phone=body.phone,
        position=body.position,
        department=body.department,
        join_date=body.join_date,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(
    staff_id: str,
    body: StaffUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(staff, key, value)

    db.commit()
    db.refresh(staff)
    return staff
