from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class InvoiceCreate(BaseModel):
    member_id: str
    unit_id: str
    amount: Decimal
    due_date: date
    period_start: Optional[date] = None
    period_end: Optional[date] = None


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    member_id: str
    unit_id: str
    amount: Decimal
    due_date: date
    status: str
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class InvoiceDetailResponse(InvoiceResponse):
    member_name: Optional[str] = None
    unit_number: Optional[str] = None
    payments: list = []


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: Decimal
    payment_date: date
    payment_method: str = "cash"
    reference: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    amount: Decimal
    payment_date: date
    payment_method: str
    reference: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
