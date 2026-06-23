from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.staff import StaffResponse


class UserMinResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class ComplaintCommentCreate(BaseModel):
    comment: str


class ComplaintCommentResponse(BaseModel):
    id: str
    complaint_id: str
    user_id: str
    comment: str
    created_at: datetime
    user: UserMinResponse

    class Config:
        from_attributes = True


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str


class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    assigned_staff_id: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: str
    building_id: str
    resident_id: str
    title: str
    description: str
    category: str
    status: str
    assigned_staff_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resident: UserMinResponse
    assigned_staff: Optional[StaffResponse] = None
    comments: List[ComplaintCommentResponse] = []

    class Config:
        from_attributes = True
