from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NoticeCreate(BaseModel):
    title: str
    content: str
    priority: str = "standard"


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    is_published: Optional[bool] = None


class NoticeResponse(BaseModel):
    id: str
    title: str
    content: str
    priority: str
    author_id: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
