from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class VehicleCreate(BaseModel):
    member_id: Optional[str] = None
    license_plate: str
    make_model: str
    color: str


class VehicleResponse(BaseModel):
    id: str
    member_id: str
    license_plate: str
    make_model: str
    color: str
    created_at: datetime
    updated_at: datetime
    member_name: Optional[str] = None
    unit_number: Optional[str] = None

    class Config:
        from_attributes = True
