import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Integer, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class PayrollStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    basic_salary = Column(Numeric(12, 2), default=0)
    housing_allowance = Column(Numeric(12, 2), default=0)
    transport_allowance = Column(Numeric(12, 2), default=0)
    medical_allowance = Column(Numeric(12, 2), default=0)
    other_allowances = Column(Numeric(12, 2), default=0)
    bonus = Column(Numeric(12, 2), default=0)
    gross_salary = Column(Numeric(12, 2), default=0)
    income_tax = Column(Numeric(12, 2), default=0)
    social_security = Column(Numeric(12, 2), default=0)
    other_deductions = Column(Numeric(12, 2), default=0)
    total_deductions = Column(Numeric(12, 2), default=0)
    net_salary = Column(Numeric(12, 2), default=0)
    working_days = Column(Integer, default=26)
    present_days = Column(Integer, default=26)
    absent_days = Column(Integer, default=0)
    overtime_hours = Column(Numeric(5, 2), default=0)
    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT)
    notes = Column(Text, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    payslip_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="payrolls")
