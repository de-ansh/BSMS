from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.member import Member
from app.models.unit import Unit
from app.models.user import User
from app.services.auth import decode_access_token
from app.services.building_scope import require_admin_building

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def require_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    require_admin_building(current_user, db)
    return current_user


def _admin_building_id(current_user: User) -> str | None:
    return current_user.building_id if current_user.role == "admin" else None


def _unit_in_admin_building(db: Session, unit_id: str, building_id: str) -> bool:
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    return unit is not None and unit.building_id == building_id


def _member_in_admin_building(db: Session, member_id: str, building_id: str) -> bool:
    member = db.query(Member).filter(Member.id == member_id).first()
    if member is None:
        return False
    if member.unit_id is None:
        return True
    return _unit_in_admin_building(db, member.unit_id, building_id)


def get_resident_member(db: Session, user: User) -> Member | None:
    if user.role != "resident":
        return None
    return db.query(Member).filter(Member.email == user.email).first()


def require_resident_member(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Member:
    member = get_resident_member(db, current_user)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No member profile linked to this account",
        )
    return member


def assert_member_access(member_id: str, db: Session, current_user: User) -> None:
    if current_user.role == "admin":
        building_id = _admin_building_id(current_user)
        if building_id and not _member_in_admin_building(db, member_id, building_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        return
    member = get_resident_member(db, current_user)
    if member is None or str(member.id) != member_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )


def assert_unit_access(unit_id: str, db: Session, current_user: User) -> None:
    if current_user.role == "admin":
        building_id = _admin_building_id(current_user)
        if building_id and not _unit_in_admin_building(db, unit_id, building_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        return
    member = get_resident_member(db, current_user)
    if member is None or member.unit_id != unit_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )


def assert_invoice_access(invoice_member_id: str, db: Session, current_user: User) -> None:
    if current_user.role == "admin":
        building_id = _admin_building_id(current_user)
        if building_id and not _member_in_admin_building(db, invoice_member_id, building_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        return
    member = get_resident_member(db, current_user)
    if member is None or str(member.id) != invoice_member_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
