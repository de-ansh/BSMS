from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserMinResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class AmenityCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rules: Optional[str] = None
    booking_required: Optional[bool] = True


class AmenityResponse(BaseModel):
    id: str
    building_id: str
    name: str
    description: Optional[str]
    rules: Optional[str]
    booking_required: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    amenity_id: str
    start_time: datetime
    end_time: datetime


class BookingStatusUpdate(BaseModel):
    status: str


class BookingResponse(BaseModel):
    id: str
    building_id: str
    amenity_id: str
    resident_id: str
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime
    updated_at: datetime
    amenity: Optional[AmenityResponse] = None
    resident: Optional[UserMinResponse] = None

    class Config:
        from_attributes = True
