from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.billing import Invoice, Payment
from app.models.member import Member
from app.models.unit import Unit
from app.models.user import User
from app.dependencies import (
    assert_invoice_access,
    get_current_user,
    get_resident_member,
    require_admin,
)
from app.schemas.billing import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceDetailResponse,
    PaymentCreate,
    PaymentResponse,
    InvoiceBulkGenerate,
    PaymentSimulate,
)
from app.services.audit import log_audit
import uuid

router = APIRouter(prefix="/billing", tags=["billing"])


def _generate_invoice_number(db: Session) -> str:
    count = db.query(Invoice).count() + 1
    return f"INV-{datetime.now().strftime('%Y%m')}-{count:04d}"


@router.get("/invoices", response_model=list[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Invoice)
    if current_user.role == "admin":
        if current_user.building_id:
            unit_ids = [
                row[0]
                for row in db.query(Unit.id)
                .filter(Unit.building_id == current_user.building_id)
                .all()
            ]
            if unit_ids:
                query = query.filter(Invoice.unit_id.in_(unit_ids))
            else:
                return []
    else:
        member = get_resident_member(db, current_user)
        if member is None:
            return []
        query = query.filter(Invoice.member_id == member.id)
    return query.order_by(Invoice.created_at.desc()).all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceDetailResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    assert_invoice_access(str(invoice.member_id), db, current_user)

    member = db.query(Member).filter(Member.id == invoice.member_id).first()
    unit = db.query(Unit).filter(Unit.id == invoice.unit_id).first()
    payments = db.query(Payment).filter(Payment.invoice_id == invoice_id).all()

    return InvoiceDetailResponse(
        id=str(invoice.id),
        invoice_number=invoice.invoice_number,
        member_id=str(invoice.member_id),
        unit_id=str(invoice.unit_id),
        amount=invoice.amount,
        due_date=invoice.due_date,
        status=invoice.status,
        period_start=invoice.period_start,
        period_end=invoice.period_end,
        created_at=str(invoice.created_at),
        member_name=member.name if member else None,
        unit_number=unit.unit_number if unit else None,
        payments=payments,
    )


@router.post("/invoices", response_model=InvoiceResponse, status_code=201)
def create_invoice(
    body: InvoiceCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    invoice = Invoice(
        invoice_number=_generate_invoice_number(db),
        member_id=body.member_id,
        unit_id=body.unit_id,
        amount=body.amount,
        due_date=body.due_date,
        period_start=body.period_start,
        period_end=body.period_end,
        status="pending",
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/payments", response_model=PaymentResponse, status_code=201)
def create_payment(
    body: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == body.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    assert_invoice_access(str(invoice.member_id), db, current_user)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can record payments")

    total_paid = (
        db.query(Payment)
        .filter(Payment.invoice_id == body.invoice_id)
        .with_entities(Payment.amount)
        .all()
    )
    paid_sum = sum(p.amount for p in total_paid) + body.amount

    payment = Payment(
        invoice_id=body.invoice_id,
        amount=body.amount,
        payment_date=body.payment_date,
        payment_method=body.payment_method,
        reference=body.reference,
    )
    db.add(payment)

    if paid_sum >= invoice.amount:
        invoice.status = "paid"
    elif paid_sum > 0:
        invoice.status = "partial"

    db.commit()
    db.refresh(payment)
    return payment


@router.post("/auto-generate", status_code=201)
def auto_generate_invoices(
    body: InvoiceBulkGenerate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if not current_user.building_id:
        raise HTTPException(status_code=400, detail="Admin is not associated with any building")

    # Find all units in this building
    units = db.query(Unit).filter(Unit.building_id == current_user.building_id).all()
    if not units:
        return {"generated_count": 0, "total_amount": 0.0}

    unit_ids = [u.id for u in units]
    # Find active members for these units
    members = db.query(Member).filter(
        Member.unit_id.in_(unit_ids),
        Member.is_active == True
    ).all()

    if not members:
        return {"generated_count": 0, "total_amount": 0.0}

    # Map unit_id to Unit
    unit_map = {u.id: u for u in units}

    generated_count = 0
    total_amount = 0.0
    base_count = db.query(Invoice).count()

    for member in members:
        if not member.unit_id:
            continue
        unit = unit_map.get(member.unit_id)
        if not unit:
            continue

        # Check for existing invoices for the same unit and period to prevent double billing
        if body.period_start and body.period_end:
            existing = db.query(Invoice).filter(
                Invoice.unit_id == unit.id,
                Invoice.period_start == body.period_start,
                Invoice.period_end == body.period_end,
                Invoice.status != "cancelled"
            ).first()
            if existing:
                continue

        invoice_number = f"INV-{datetime.now().strftime('%Y%m')}-{(base_count + generated_count + 1):04d}"
        invoice = Invoice(
            invoice_number=invoice_number,
            member_id=member.id,
            unit_id=unit.id,
            amount=unit.maintenance_fee,
            due_date=body.due_date,
            period_start=body.period_start,
            period_end=body.period_end,
            status="pending",
        )
        db.add(invoice)
        generated_count += 1
        total_amount += float(unit.maintenance_fee)

    if generated_count > 0:
        db.commit()
        log_audit(
            db=db,
            action="auto_generate_invoices",
            entity_type="invoice",
            user_id=current_user.id,
            details=f"Auto-generated {generated_count} invoices total value ${total_amount:.2f} for period {body.period_start} to {body.period_end}"
        )

    return {"generated_count": generated_count, "total_amount": total_amount}


@router.post("/pay", response_model=PaymentResponse, status_code=201)
def pay_invoice(
    body: PaymentSimulate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == body.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    assert_invoice_access(str(invoice.member_id), db, current_user)

    if invoice.status == "paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")

    if not body.card_number or not body.expiry or not body.cvv:
        raise HTTPException(status_code=400, detail="Invalid card details")

    # Calculate remaining amount
    total_paid = (
        db.query(Payment)
        .filter(Payment.invoice_id == body.invoice_id)
        .with_entities(Payment.amount)
        .all()
    )
    paid_sum = sum(p.amount for p in total_paid)
    remaining = invoice.amount - paid_sum

    if remaining <= 0:
        invoice.status = "paid"
        db.commit()
        raise HTTPException(status_code=400, detail="Invoice is already fully paid")

    payment = Payment(
        invoice_id=body.invoice_id,
        amount=remaining,
        payment_date=datetime.now().date(),
        payment_method="credit_card",
        reference=f"SIM-{uuid.uuid4().hex[:8].upper()}",
    )
    db.add(payment)
    invoice.status = "paid"
    db.commit()
    db.refresh(payment)

    log_audit(
        db=db,
        action="pay_invoice_online",
        entity_type="payment",
        user_id=current_user.id,
        entity_id=payment.id,
        details=f"Paid invoice {invoice.invoice_number} via online simulation. Reference: {payment.reference}"
    )

    return payment
