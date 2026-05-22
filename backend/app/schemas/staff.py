from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class StaffCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    position: str
    department: str
    join_date: date


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    join_date: Optional[date] = None
    is_active: Optional[bool] = None


class StaffResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    position: str
    department: str
    join_date: date
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
