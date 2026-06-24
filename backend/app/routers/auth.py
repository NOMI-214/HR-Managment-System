from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.schemas.auth import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest,
    ResetPasswordRequest, VerifyEmailRequest, ChangePasswordRequest,
    RefreshTokenRequest
)
from app.models.user import User, UserRole, EmailVerification, PasswordReset
from app.models.company import Company
from app.models.employee import Employee
from app.models.subscription import Subscription, PlanType
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, generate_token
)
from app.core.dependencies import get_current_user
from app.services.email import send_verification_email, send_password_reset_email
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    validate_password(data.password)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    company = Company(name=data.company_name, email=data.email)
    db.add(company)
    db.flush()

    subscription = Subscription(company_id=company.id, plan=PlanType.FREE, max_employees=10)
    db.add(subscription)

    user = User(
        company_id=company.id,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.COMPANY_ADMIN,
        is_verified=False
    )
    db.add(user)
    db.flush()

    token = generate_token()
    verification = EmailVerification(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(verification)
    db.commit()

    background_tasks.add_task(send_verification_email, data.name, data.email, token, settings.frontend_url)

    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "user_id": user.id
    }


@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email, User.is_active == True).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in")

    user.last_login = datetime.utcnow()
    db.commit()

    access_token = create_access_token({"sub": user.id, "role": user.role, "company_id": user.company_id})
    refresh_token = create_refresh_token({"sub": user.id})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "company_id": user.company_id,
            "avatar_url": user.avatar_url
        }
    }


@router.post("/verify-email")
async def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    verification = db.query(EmailVerification).filter(EmailVerification.token == data.token).first()
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    if verification.expires_at < datetime.utcnow():
        db.delete(verification)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification token expired")

    user = db.query(User).filter(User.id == verification.user_id).first()
    user.is_verified = True
    db.delete(verification)
    db.commit()

    return {"message": "Email verified successfully. You can now log in."}


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        db.query(PasswordReset).filter(PasswordReset.user_id == user.id).delete()
        token = generate_token()
        reset = PasswordReset(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(reset)
        db.commit()
        background_tasks.add_task(send_password_reset_email, user.name, user.email, token, settings.frontend_url)

    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    validate_password(data.new_password)
    reset = db.query(PasswordReset).filter(PasswordReset.token == data.token).first()
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid reset token")
    if reset.expires_at < datetime.utcnow():
        db.delete(reset)
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token expired")

    user = db.query(User).filter(User.id == reset.user_id).first()
    user.password_hash = hash_password(data.new_password)
    db.delete(reset)
    db.commit()

    return {"message": "Password reset successful. You can now log in."}


@router.post("/refresh")
async def refresh_token(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == payload.get("sub"), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": user.id, "role": user.role, "company_id": user.company_id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "company_id": current_user.company_id,
        "avatar_url": current_user.avatar_url,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    validate_password(data.new_password)
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
