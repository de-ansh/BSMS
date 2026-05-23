from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.building import Building
from app.models.user import User
from app.schemas.building import BuildingResponse
from app.services.building_scope import get_building_or_404, require_admin_building

router = APIRouter(prefix="/buildings", tags=["buildings"])


@router.get("/mine", response_model=BuildingResponse)
def get_my_building(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    building = require_admin_building(current_user, db)
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
        admin_count=0,
        unit_count=0,
    )
