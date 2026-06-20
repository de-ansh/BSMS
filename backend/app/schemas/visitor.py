from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class VisitorBase(BaseModel):
    visitor_name: str
    phone: Optional[str] = None
    purpose: Optional[str] = None
    expected_arrival: Optional[date] = None


class VisitorCreate(VisitorBase):
    pass


class VisitorStatusUpdate(BaseModel):
    status: str


class VisitorResponse(VisitorBase):
    id: str
    building_id: str
    host_id: str
    status: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
