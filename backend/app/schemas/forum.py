from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ForumCommentCreate(BaseModel):
    content: str

class ForumCommentResponse(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_name: Optional[str] = None
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    title: str
    content: str

class PostResponse(BaseModel):
    id: str
    building_id: str
    author_id: str
    author_name: Optional[str] = None
    title: str
    content: str
    comment_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PostDetailResponse(BaseModel):
    id: str
    building_id: str
    author_id: str
    author_name: Optional[str] = None
    title: str
    content: str
    comments: List[ForumCommentResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
