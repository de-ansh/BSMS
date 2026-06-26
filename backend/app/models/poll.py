import uuid
from datetime import datetime
from sqlalchemy import DateTime, String, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Poll(Base):
    __tablename__ = "polls"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    building_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    creator_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    question: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

class PollOption(Base):
    __tablename__ = "poll_options"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    poll_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    option_text: Mapped[str] = mapped_column(String(255), nullable=False)

class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("poll_id", "user_id", name="uq_vote_poll_user"),)

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    poll_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    option_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now
    )
