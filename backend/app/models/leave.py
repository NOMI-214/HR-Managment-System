import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Integer, Date
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class LeaveType(str, enum.Enum):
    ANNUAL = "ANNUAL"
    SICK = "SICK"
    CASUAL = "CASUAL"
    UNPAID = "UNPAID"
    MATERNITY = "MATERNITY"
    PATERNITY = "PATERNITY"


class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED_BY_TL = "APPROVED_BY_TL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    year = Column(Integer, nullable=False)
    annual_total = Column(Integer, default=21)
    annual_used = Column(Integer, default=0)
    sick_total = Column(Integer, default=10)
    sick_used = Column(Integer, default=0)
    casual_total = Column(Integer, default=5)
    casual_used = Column(Integer, default=0)

    employee = relationship("Employee")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days_requested = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING)
    tl_approved_by = Column(String(36), ForeignKey("employees.id"), nullable=True)
    tl_approved_at = Column(DateTime, nullable=True)
    hr_approved_by = Column(String(36), ForeignKey("employees.id"), nullable=True)
    hr_approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="leave_requests")
    tl_approver = relationship("Employee", foreign_keys=[tl_approved_by])
    hr_approver = relationship("Employee", foreign_keys=[hr_approved_by])
