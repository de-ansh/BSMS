from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.amenity import Amenity, Booking
from app.models.user import User
from app.dependencies import get_current_user
from app.schemas.amenity import (
    AmenityCreate,
    AmenityResponse,
    BookingCreate,
    BookingResponse,
    BookingStatusUpdate,
)
from app.services.audit import log_audit

router = APIRouter(prefix="/amenities", tags=["amenities"])


@router.get("/", response_model=list[AmenityResponse])
def list_amenities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.building_id:
        return []
    return db.query(Amenity).filter(Amenity.building_id == current_user.building_id).order_by(Amenity.name).all()


@router.post("/", response_model=AmenityResponse, status_code=201)
def create_amenity(
    body: AmenityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to create amenities")
    if not current_user.building_id:
        raise HTTPException(status_code=400, detail="User not associated with a building")

    amenity = Amenity(
        building_id=current_user.building_id,
        name=body.name,
        description=body.description,
        rules=body.rules,
        booking_required=body.booking_required if body.booking_required is not None else True
    )
    db.add(amenity)
    db.commit()
    db.refresh(amenity)

    log_audit(
        db=db,
        action="create_amenity",
        entity_type="amenity",
        user_id=current_user.id,
        entity_id=amenity.id,
        details=f"Amenity created: {amenity.name}"
    )

    return amenity


@router.get("/bookings", response_model=list[BookingResponse])
def list_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Booking)
    if current_user.role == "resident":
        query = query.filter(Booking.resident_id == current_user.id)
    elif current_user.role == "admin":
        if current_user.building_id:
            query = query.filter(Booking.building_id == current_user.building_id)
        else:
            return []
    # super_admin sees all

    bookings = query.order_by(Booking.start_time.desc()).all()
    res_list = []
    for b in bookings:
        amenity = db.query(Amenity).filter(Amenity.id == b.amenity_id).first()
        resident = db.query(User).filter(User.id == b.resident_id).first()
        res_list.append({
            "id": b.id,
            "building_id": b.building_id,
            "amenity_id": b.amenity_id,
            "resident_id": b.resident_id,
            "start_time": b.start_time,
            "end_time": b.end_time,
            "status": b.status,
            "created_at": b.created_at,
            "updated_at": b.updated_at,
            "amenity": amenity,
            "resident": {
                "id": resident.id,
                "name": resident.name,
                "email": resident.email,
                "role": resident.role
            } if resident else None
        })
    return res_list


@router.post("/bookings", response_model=BookingResponse, status_code=201)
def create_booking(
    body: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.building_id:
        raise HTTPException(status_code=400, detail="User not associated with a building")

    # Timezone conversion & validation
    start_naive = body.start_time.replace(tzinfo=None) if body.start_time.tzinfo else body.start_time
    end_naive = body.end_time.replace(tzinfo=None) if body.end_time.tzinfo else body.end_time

    if start_naive >= end_naive:
        raise HTTPException(status_code=400, detail="Start time must be before end time.")

    now_naive = datetime.now()
    if start_naive <= now_naive:
         raise HTTPException(status_code=400, detail="Booking start time must be in the future.")

    # Check that amenity exists and belongs to the same building
    amenity = db.query(Amenity).filter(Amenity.id == body.amenity_id).first()
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    if amenity.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Amenity does not belong to your building")

    # Strict overlap check
    overlap = db.query(Booking).filter(
        Booking.amenity_id == body.amenity_id,
        Booking.status.in_(["pending", "approved"]),
        Booking.start_time < end_naive,
        Booking.end_time > start_naive
    ).first()
    if overlap:
        raise HTTPException(status_code=400, detail="This time slot overlaps with an existing booking.")

    booking = Booking(
        building_id=current_user.building_id,
        amenity_id=body.amenity_id,
        resident_id=current_user.id,
        start_time=start_naive,
        end_time=end_naive,
        status="pending"
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    log_audit(
        db=db,
        action="create_booking",
        entity_type="booking",
        user_id=current_user.id,
        entity_id=booking.id,
        details=f"Requested booking for amenity {amenity.name} from {booking.start_time} to {booking.end_time}"
    )

    return {
        "id": booking.id,
        "building_id": booking.building_id,
        "amenity_id": booking.amenity_id,
        "resident_id": booking.resident_id,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "status": booking.status,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
        "amenity": amenity,
        "resident": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        }
    }


@router.patch("/bookings/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: str,
    body: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Authorization checks
    if current_user.role == "resident":
        if booking.resident_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this booking")
        if body.status != "cancelled":
            raise HTTPException(status_code=403, detail="Residents can only cancel bookings")
    elif current_user.role == "admin":
        if booking.building_id != current_user.building_id:
            raise HTTPException(status_code=403, detail="Not authorized for bookings in this building")
        if body.status not in ("approved", "rejected", "cancelled"):
            raise HTTPException(status_code=400, detail="Invalid booking status update")
    elif current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    booking.status = body.status
    db.commit()
    db.refresh(booking)

    log_audit(
        db=db,
        action="update_booking_status",
        entity_type="booking",
        user_id=current_user.id,
        entity_id=booking.id,
        details=f"Booking status updated to: {booking.status}"
    )

    amenity = db.query(Amenity).filter(Amenity.id == booking.amenity_id).first()
    resident = db.query(User).filter(User.id == booking.resident_id).first()

    return {
        "id": booking.id,
        "building_id": booking.building_id,
        "amenity_id": booking.amenity_id,
        "resident_id": booking.resident_id,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "status": booking.status,
        "created_at": booking.created_at,
        "updated_at": booking.updated_at,
        "amenity": amenity,
        "resident": {
            "id": resident.id,
            "name": resident.name,
            "email": resident.email,
            "role": resident.role
        } if resident else None
    }
