from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class PollOptionResponse(BaseModel):
    id: str
    poll_id: str
    option_text: str
    vote_count: int = 0

    class Config:
        from_attributes = True

class PollCreate(BaseModel):
    question: str
    options: List[str]
    expires_at: Optional[datetime] = None

class PollResponse(BaseModel):
    id: str
    building_id: str
    creator_id: str
    creator_name: Optional[str] = None
    question: str
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    options: List[PollOptionResponse] = []
    voted_option_id: Optional[str] = None

    class Config:
        from_attributes = True

class VoteCreate(BaseModel):
    option_id: str
