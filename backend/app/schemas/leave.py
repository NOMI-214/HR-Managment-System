from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum


class LeaveTypeEnum(str, Enum):
    ANNUAL = "ANNUAL"
    SICK = "SICK"
    CASUAL = "CASUAL"
    UNPAID = "UNPAID"


class LeaveCreate(BaseModel):
    leave_type: LeaveTypeEnum
    start_date: date
    end_date: date
    reason: Optional[str] = None


class LeaveApproval(BaseModel):
    action: str  # "approve" or "reject"
    rejection_reason: Optional[str] = None


class LeaveResponse(BaseModel):
    id: str
    employee_id: str
    company_id: str
    leave_type: str
    start_date: date
    end_date: date
    days_requested: int
    reason: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
