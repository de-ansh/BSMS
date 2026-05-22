from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.unit import Unit
from app.models.member import Member
from app.models.staff import Staff
from app.models.billing import Invoice
from app.models.user import User
from app.dependencies import require_admin
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    total_units = db.query(Unit).count()
    occupied_units = db.query(Unit).filter(Unit.status == "occupied").count()
    total_members = db.query(Member).count()
    total_staff = db.query(Staff).count()

    pending_invoices = (
        db.query(Invoice)
        .filter(Invoice.status.in_(["pending", "overdue"]))
        .all()
    )
    pending_amount = sum(inv.amount for inv in pending_invoices)
    overdue_count = len(
        [inv for inv in pending_invoices if inv.status == "overdue"]
    )

    return DashboardStats(
        total_units=total_units,
        occupied_units=occupied_units,
        vacancy_rate=f"{occupied_units / total_units * 100:.0f}%" if total_units else "0%",
        pending_payments=pending_amount,
        overdue_count=overdue_count,
        staff_on_duty=total_staff,
        total_members=total_members,
        total_staff=total_staff,
    )
