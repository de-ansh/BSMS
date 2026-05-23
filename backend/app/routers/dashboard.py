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


def _unit_ids_for_admin(db: Session, building_id: str) -> list[str]:
    rows = db.query(Unit.id).filter(Unit.building_id == building_id).all()
    return [str(row[0]) for row in rows]


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    units_query = db.query(Unit)
    members_query = db.query(Member)
    invoices_query = db.query(Invoice)

    if current_user.building_id:
        unit_ids = _unit_ids_for_admin(db, current_user.building_id)
        units_query = units_query.filter(Unit.building_id == current_user.building_id)
        if unit_ids:
            members_query = members_query.filter(Member.unit_id.in_(unit_ids))
            invoices_query = invoices_query.filter(Invoice.unit_id.in_(unit_ids))
        else:
            members_query = members_query.filter(Member.id.is_(None))
            invoices_query = invoices_query.filter(Invoice.id.is_(None))

    total_units = units_query.count()
    occupied_units = units_query.filter(Unit.status == "occupied").count()
    total_members = members_query.count()
    total_staff = db.query(Staff).count()

    pending_invoices = (
        invoices_query.filter(Invoice.status.in_(["pending", "overdue"])).all()
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
