from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notice import Notice
from app.models.user import User
from app.dependencies import get_current_user, require_admin
from app.schemas.notice import NoticeCreate, NoticeResponse, NoticeUpdate

router = APIRouter(prefix="/notices", tags=["notices"])


@router.get("/", response_model=list[NoticeResponse])
def list_notices(
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    return db.query(Notice).order_by(Notice.created_at.desc()).all()


@router.post("/", response_model=NoticeResponse, status_code=201)
def create_notice(
    body: NoticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    notice = Notice(
        title=body.title,
        content=body.content,
        priority=body.priority,
        author_id=str(current_user.id),
        is_published=True,
        published_at=datetime.now(timezone.utc),
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice


@router.put("/{notice_id}", response_model=NoticeResponse)
def update_notice(
    notice_id: str,
    body: NoticeUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(notice, key, value)

    db.commit()
    db.refresh(notice)
    return notice


@router.delete("/{notice_id}", status_code=204)
def delete_notice(
    notice_id: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(notice)
    db.commit()
