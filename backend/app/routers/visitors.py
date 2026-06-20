from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.visitor import Visitor
from app.models.user import User
from app.dependencies import get_current_user
from app.schemas.visitor import (
    VisitorCreate,
    VisitorResponse,
    VisitorStatusUpdate,
)

router = APIRouter(prefix="/visitors", tags=["visitors"])


@router.get("/", response_model=list[VisitorResponse])
def list_visitors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Visitor)
    if current_user.role == "admin":
        if current_user.building_id:
            query = query.filter(Visitor.building_id == current_user.building_id)
        else:
            return []
    elif current_user.role == "resident":
        query = query.filter(Visitor.host_id == current_user.id)
    else:
        # super_admin can see all, but let's restrict or let them see all
        pass
        
    return query.order_by(Visitor.created_at.desc()).all()


@router.post("/", response_model=VisitorResponse, status_code=201)
def create_visitor(
    body: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Depending on role, either pre-approved by resident or logged by admin
    if not current_user.building_id:
        raise HTTPException(status_code=400, detail="User not associated with a building")

    visitor = Visitor(
        building_id=current_user.building_id,
        visitor_name=body.visitor_name,
        phone=body.phone,
        purpose=body.purpose,
        host_id=current_user.id,
        expected_arrival=body.expected_arrival,
        status="approved" if current_user.role == "resident" else "pending",
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor


@router.patch("/{visitor_id}/status", response_model=VisitorResponse)
def update_visitor_status(
    visitor_id: str,
    body: VisitorStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to update status")

    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
        
    if current_user.role == "admin" and visitor.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Visitor is not for your building")

    visitor.status = body.status
    if body.status == "checked_in" and not visitor.check_in_time:
        visitor.check_in_time = datetime.now()
    elif body.status == "checked_out" and not visitor.check_out_time:
        visitor.check_out_time = datetime.now()

    db.commit()
    db.refresh(visitor)
    return visitor
