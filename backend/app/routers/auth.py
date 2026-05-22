from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth import (
    authenticate_user,
    create_access_token,
    hash_password,
)
from app.services.audit import log_audit
from app.services.rate_limit import (
    check_login_rate_limit,
    clear_login_attempts,
    record_failed_login,
)
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    rate_key = f"{request.client.host if request.client else 'unknown'}:{body.email.lower()}"
    check_login_rate_limit(
        rate_key,
        max_attempts=settings.login_rate_limit_attempts,
        window_seconds=settings.login_rate_limit_window_seconds,
    )

    user = authenticate_user(db, body.email, body.password)
    if not user or user.role != body.role:
        record_failed_login(rate_key)
        log_audit(
            db,
            action="login_failed",
            entity_type="user",
            details=f"Failed login for {body.email} as {body.role}",
            ip_address=request.client.host if request.client else None,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    clear_login_attempts(rate_key)
    token = create_access_token(str(user.id), user.role)
    log_audit(
        db,
        user_id=str(user.id),
        action="login",
        entity_type="user",
        entity_id=str(user.id),
        details=f"Successful login as {user.role}",
        ip_address=request.client.host if request.client else None,
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/seed", status_code=201)
def seed_admin(db: Session = Depends(get_db)):
    if not settings.allow_seed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    existing = db.query(User).filter(User.email == "admin@society.com").first()
    if existing:
        return {"message": "Admin already exists"}
    user = User(
        email="admin@society.com",
        password_hash=hash_password("admin123"),
        name="Admin User",
        role="admin",
    )
    db.add(user)
    db.commit()
    return {"message": "Admin created", "email": "admin@society.com"}
