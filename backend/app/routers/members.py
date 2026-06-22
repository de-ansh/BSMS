from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.member import Member
from app.models.unit import Unit
from app.models.billing import Invoice, Payment
from app.models.user import User
from app.dependencies import (
    assert_member_access,
    get_current_user,
    get_resident_member,
    require_admin,
)
from app.services.auth import hash_password
from app.schemas.member import (
    MemberCreate,
    MemberResponse,
    MemberDetailResponse,
    MemberUpdate,
)

router = APIRouter(prefix="/members", tags=["members"])


def _build_member_detail(db: Session, member: Member) -> MemberDetailResponse:
    unit = db.query(Unit).filter(Unit.id == member.unit_id).first() if member.unit_id else None
    invoices = db.query(Invoice).filter(Invoice.member_id == member.id).all()
    outstanding = sum(
        inv.amount for inv in invoices if inv.status in ("pending", "overdue")
    )
    payments = (
        db.query(Payment)
        .filter(Payment.invoice_id.in_([inv.id for inv in invoices]))
        .all()
        if invoices
        else []
    )

    return MemberDetailResponse(
        id=str(member.id),
        name=member.name,
        email=member.email,
        phone=member.phone,
        unit_id=str(member.unit_id) if member.unit_id else None,
        move_in_date=member.move_in_date,
        is_owner=member.is_owner,
        is_active=member.is_active,
        created_at=str(member.created_at),
        unit_number=unit.unit_number if unit else None,
        building=unit.building if unit else None,
        maintenance_fee=unit.maintenance_fee if unit else None,
        outstanding_balance=outstanding,
        payment_history=payments[:10] if payments else [],
    )


@router.get("/", response_model=list[MemberResponse])
def list_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "admin":
        query = db.query(Member)
        if current_user.building_id:
            unit_ids = [
                row[0]
                for row in db.query(Unit.id)
                .filter(Unit.building_id == current_user.building_id)
                .all()
            ]
            if unit_ids:
                query = query.filter(
                    (Member.unit_id.in_(unit_ids)) | (Member.unit_id.is_(None))
                )
            else:
                query = query.filter(Member.unit_id.is_(None))
        return query.order_by(Member.name).all()

    member = get_resident_member(db, current_user)
    if member is None:
        return []
    return [member]


@router.get("/{member_id}", response_model=MemberDetailResponse)
def get_member(
    member_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assert_member_access(member_id, db, current_user)
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return _build_member_detail(db, member)


@router.post("/", response_model=MemberResponse, status_code=201)
def create_member(
    body: MemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if body.unit_id and current_user.building_id:
        unit = db.query(Unit).filter(Unit.id == body.unit_id).first()
        if not unit or unit.building_id != current_user.building_id:
            raise HTTPException(status_code=400, detail="Unit does not belong to your building")

    member = Member(
        name=body.name,
        email=body.email,
        phone=body.phone,
        unit_id=body.unit_id,
        move_in_date=body.move_in_date,
        is_owner=body.is_owner,
    )
    db.add(member)

    if body.password:
        existing_user = db.query(User).filter(User.email == body.email).first()
        if not existing_user:
            user = User(
                email=body.email,
                name=body.name,
                password_hash=hash_password(body.password),
                role="resident",
                building_id=current_user.building_id,
            )
            db.add(user)

    db.commit()
    db.refresh(member)
    return member


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: str,
    body: MemberUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(member, key, value)

    db.commit()
    db.refresh(member)
    return member
