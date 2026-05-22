import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    unit_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    building: Mapped[str] = mapped_column(String(255), nullable=False)
    floor: Mapped[int] = mapped_column(nullable=False)
    bedrooms: Mapped[int] = mapped_column(default=1)
    bathrooms: Mapped[int] = mapped_column(default=1)
    area_sqft: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    maintenance_fee: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00")
    )
    status: Mapped[str] = mapped_column(
        String(50), default="vacant"
    )
    occupant_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )
