from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class UnitCreate(BaseModel):
    unit_number: str
    building: str
    floor: int
    bedrooms: int = 1
    bathrooms: int = 1
    area_sqft: Optional[Decimal] = None
    maintenance_fee: Decimal = Decimal("0.00")
    status: str = "vacant"


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[Decimal] = None
    maintenance_fee: Optional[Decimal] = None
    status: Optional[str] = None


class UnitResponse(BaseModel):
    id: str
    unit_number: str
    building: str
    floor: int
    bedrooms: int
    bathrooms: int
    area_sqft: Optional[Decimal] = None
    maintenance_fee: Decimal
    status: str
    occupant_id: Optional[str] = None
    occupant_name: Optional[str] = None

    model_config = {"from_attributes": True}
