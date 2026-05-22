from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.dependencies import require_admin
from app.schemas.audit_log import AuditLogResponse

router = APIRouter(prefix="/audit-log", tags=["audit-log"])


@router.get("/", response_model=list[AuditLogResponse])
def list_audit_logs(
    entity_type: str | None = Query(None),
    action: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    query = db.query(AuditLog)

    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)

    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
