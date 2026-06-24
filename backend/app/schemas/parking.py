from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ParkingSlotCreate(BaseModel):
    slot_number: str
    status: Optional[str] = "available"


class ParkingSlotAllocate(BaseModel):
    unit_id: Optional[str] = None


class ParkingSlotStatusUpdate(BaseModel):
    status: str


class ParkingSlotResponse(BaseModel):
    id: str
    building_id: str
    unit_id: Optional[str]
    slot_number: str
    status: str
    created_at: datetime
    updated_at: datetime
    unit_number: Optional[str] = None

    class Config:
        from_attributes = True
