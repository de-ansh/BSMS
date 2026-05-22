from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr


class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    unit_id: Optional[str] = None
    move_in_date: Optional[date] = None
    is_owner: bool = True


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    unit_id: Optional[str] = None
    move_in_date: Optional[date] = None
    is_owner: Optional[bool] = None
    is_active: Optional[bool] = None


class MemberResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    unit_id: Optional[str] = None
    move_in_date: Optional[date] = None
    is_owner: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberDetailResponse(MemberResponse):
    unit_number: Optional[str] = None
    building: Optional[str] = None
    maintenance_fee: Optional[Decimal] = None
    outstanding_balance: Decimal = Decimal("0.00")
    payment_history: list = []
