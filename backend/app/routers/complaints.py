from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.complaint import Complaint, ComplaintComment
from app.models.user import User
from app.models.staff import Staff
from app.dependencies import get_current_user
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintUpdate,
    ComplaintCommentCreate,
    ComplaintCommentResponse,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("/", response_model=list[ComplaintResponse])
def list_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Complaint)
    if current_user.role == "resident":
        query = query.filter(Complaint.resident_id == current_user.id)
    elif current_user.role == "admin":
        if current_user.building_id:
            query = query.filter(Complaint.building_id == current_user.building_id)
        else:
            return []
    # super_admin sees all

    complaints = query.order_by(Complaint.created_at.desc()).all()
    res_list = []
    for comp in complaints:
        resident_user = db.query(User).filter(User.id == comp.resident_id).first()
        staff_member = db.query(Staff).filter(Staff.id == comp.assigned_staff_id).first() if comp.assigned_staff_id else None

        comments_list = []
        comments = db.query(ComplaintComment).filter(ComplaintComment.complaint_id == comp.id).order_by(ComplaintComment.created_at.asc()).all()
        for c in comments:
            poster = db.query(User).filter(User.id == c.user_id).first()
            comments_list.append({
                "id": c.id,
                "complaint_id": c.complaint_id,
                "user_id": c.user_id,
                "comment": c.comment,
                "created_at": c.created_at,
                "user": {
                    "id": poster.id,
                    "name": poster.name,
                    "email": poster.email,
                    "role": poster.role
                } if poster else None
            })

        res_list.append({
            "id": comp.id,
            "building_id": comp.building_id,
            "resident_id": comp.resident_id,
            "title": comp.title,
            "description": comp.description,
            "category": comp.category,
            "status": comp.status,
            "assigned_staff_id": comp.assigned_staff_id,
            "created_at": comp.created_at,
            "updated_at": comp.updated_at,
            "resident": {
                "id": resident_user.id,
                "name": resident_user.name,
                "email": resident_user.email,
                "role": resident_user.role
            } if resident_user else None,
            "assigned_staff": staff_member,
            "comments": comments_list
        })
    return res_list


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "resident" and comp.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "admin" and comp.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Access denied")

    resident_user = db.query(User).filter(User.id == comp.resident_id).first()
    staff_member = db.query(Staff).filter(Staff.id == comp.assigned_staff_id).first() if comp.assigned_staff_id else None

    comments_list = []
    comments = db.query(ComplaintComment).filter(ComplaintComment.complaint_id == comp.id).order_by(ComplaintComment.created_at.asc()).all()
    for c in comments:
        poster = db.query(User).filter(User.id == c.user_id).first()
        comments_list.append({
            "id": c.id,
            "complaint_id": c.complaint_id,
            "user_id": c.user_id,
            "comment": c.comment,
            "created_at": c.created_at,
            "user": {
                "id": poster.id,
                "name": poster.name,
                "email": poster.email,
                "role": poster.role
            } if poster else None
        })

    return {
        "id": comp.id,
        "building_id": comp.building_id,
        "resident_id": comp.resident_id,
        "title": comp.title,
        "description": comp.description,
        "category": comp.category,
        "status": comp.status,
        "assigned_staff_id": comp.assigned_staff_id,
        "created_at": comp.created_at,
        "updated_at": comp.updated_at,
        "resident": {
            "id": resident_user.id,
            "name": resident_user.name,
            "email": resident_user.email,
            "role": resident_user.role
        } if resident_user else None,
        "assigned_staff": staff_member,
        "comments": comments_list
    }


@router.post("/", response_model=ComplaintResponse, status_code=201)
def create_complaint(
    body: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "resident":
        raise HTTPException(status_code=403, detail="Only residents can create complaints")
    if not current_user.building_id:
        raise HTTPException(status_code=400, detail="User not associated with a building")

    complaint = Complaint(
        building_id=current_user.building_id,
        resident_id=current_user.id,
        title=body.title,
        description=body.description,
        category=body.category,
        status="pending"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    log_audit(
        db=db,
        action="create_complaint",
        entity_type="complaint",
        user_id=current_user.id,
        entity_id=complaint.id,
        details=f"Complaint created: {complaint.title}"
    )

    return {
        "id": complaint.id,
        "building_id": complaint.building_id,
        "resident_id": complaint.resident_id,
        "title": complaint.title,
        "description": complaint.description,
        "category": complaint.category,
        "status": complaint.status,
        "assigned_staff_id": None,
        "created_at": complaint.created_at,
        "updated_at": complaint.updated_at,
        "resident": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        },
        "assigned_staff": None,
        "comments": []
    }


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: str,
    body: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to update complaints")

    if current_user.role == "admin" and comp.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Not authorized to update complaints in this building")

    if body.status is not None:
        comp.status = body.status
    if body.assigned_staff_id is not None:
        if body.assigned_staff_id:
            staff_exists = db.query(Staff).filter(Staff.id == body.assigned_staff_id).first()
            if not staff_exists:
                raise HTTPException(status_code=404, detail="Staff not found")
        comp.assigned_staff_id = body.assigned_staff_id or None

    db.commit()
    db.refresh(comp)

    log_audit(
        db=db,
        action="update_complaint",
        entity_type="complaint",
        user_id=current_user.id,
        entity_id=comp.id,
        details=f"Status updated to: {comp.status}, Assigned Staff: {comp.assigned_staff_id}"
    )

    # Return full response
    resident_user = db.query(User).filter(User.id == comp.resident_id).first()
    staff_member = db.query(Staff).filter(Staff.id == comp.assigned_staff_id).first() if comp.assigned_staff_id else None

    comments_list = []
    comments = db.query(ComplaintComment).filter(ComplaintComment.complaint_id == comp.id).order_by(ComplaintComment.created_at.asc()).all()
    for c in comments:
        poster = db.query(User).filter(User.id == c.user_id).first()
        comments_list.append({
            "id": c.id,
            "complaint_id": c.complaint_id,
            "user_id": c.user_id,
            "comment": c.comment,
            "created_at": c.created_at,
            "user": {
                "id": poster.id,
                "name": poster.name,
                "email": poster.email,
                "role": poster.role
            } if poster else None
        })

    return {
        "id": comp.id,
        "building_id": comp.building_id,
        "resident_id": comp.resident_id,
        "title": comp.title,
        "description": comp.description,
        "category": comp.category,
        "status": comp.status,
        "assigned_staff_id": comp.assigned_staff_id,
        "created_at": comp.created_at,
        "updated_at": comp.updated_at,
        "resident": {
            "id": resident_user.id,
            "name": resident_user.name,
            "email": resident_user.email,
            "role": resident_user.role
        } if resident_user else None,
        "assigned_staff": staff_member,
        "comments": comments_list
    }


@router.post("/{complaint_id}/comments", response_model=ComplaintCommentResponse, status_code=201)
def create_complaint_comment(
    complaint_id: str,
    body: ComplaintCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "resident" and comp.resident_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "admin" and comp.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Access denied")

    comment = ComplaintComment(
        complaint_id=complaint_id,
        user_id=current_user.id,
        comment=body.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    log_audit(
        db=db,
        action="add_complaint_comment",
        entity_type="complaint",
        user_id=current_user.id,
        entity_id=comp.id,
        details="Added comment to complaint"
    )

    return {
        "id": comment.id,
        "complaint_id": comment.complaint_id,
        "user_id": comment.user_id,
        "comment": comment.comment,
        "created_at": comment.created_at,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        }
    }
