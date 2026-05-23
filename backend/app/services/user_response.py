from sqlalchemy.orm import Session

from app.models.building import Building
from app.models.user import User
from app.schemas.auth import UserResponse


def build_user_response(db: Session, user: User) -> UserResponse:
    building_name = None
    if user.building_id:
        building = db.query(Building).filter(Building.id == user.building_id).first()
        building_name = building.name if building else None

    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        role=user.role,
        building_id=user.building_id,
        building_name=building_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )
