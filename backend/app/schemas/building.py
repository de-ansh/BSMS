from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class BuildingCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=2, max_length=50, pattern=r"^[a-z0-9-]+$")
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None


class BuildingUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    is_active: Optional[bool] = None


class BuildingResponse(BaseModel):
    id: str
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    is_active: bool
    created_at: datetime
    admin_count: int = 0
    unit_count: int = 0

    model_config = {"from_attributes": True}


class BuildingAdminCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class AdminStatusUpdate(BaseModel):
    is_active: bool


class BuildingAdminResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    building_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
