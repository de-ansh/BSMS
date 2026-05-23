from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.building import Building
from app.models.user import User


def get_building_or_404(db: Session, building_id: str) -> Building:
    building = db.query(Building).filter(Building.id == building_id).first()
    if not building:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Building not found")
    return building


def assert_building_active(building: Building) -> None:
    if not building.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This building has been disabled. Contact platform support.",
        )


def get_admin_building_id(user: User) -> str | None:
    if user.role == "super_admin":
        return None
    if user.role == "admin":
        return user.building_id
    return None


def require_admin_building(user: User, db: Session) -> Building:
    if user.role != "admin" or not user.building_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Building assignment required for society admin",
        )
    building = get_building_or_404(db, user.building_id)
    assert_building_active(building)
    return building
