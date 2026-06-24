from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from typing import Optional, List

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


def require_roles(roles: List[UserRole]):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return checker


def get_company_filter(current_user: User = Depends(get_current_user)):
    return current_user.company_id


require_admin = require_roles([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])
require_hr = require_roles([UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])
require_tl = require_roles([UserRole.TEAM_LEAD, UserRole.HR_MANAGER, UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN])
