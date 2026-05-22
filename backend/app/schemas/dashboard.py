from decimal import Decimal

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_units: int
    occupied_units: int
    vacancy_rate: str
    pending_payments: Decimal
    overdue_count: int
    staff_on_duty: int
    total_members: int
    total_staff: int
