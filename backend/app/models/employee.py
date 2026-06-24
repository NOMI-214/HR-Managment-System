import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Boolean, Enum, ForeignKey, Text, Date, Numeric
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TERMINATED = "TERMINATED"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    manager_id = Column(String(36), ForeignKey("employees.id"), nullable=True)
    employee_id = Column(String(50), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    designation = Column(String(100), nullable=True)
    employment_type = Column(String(50), default="FULL_TIME")
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.ACTIVE)
    joining_date = Column(Date, nullable=True)
    salary = Column(Numeric(12, 2), default=0)
    avatar_url = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    cnic = Column(String(50), nullable=True)
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(50), nullable=True)
    bank_account = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="employee")
    company = relationship("Company", back_populates="employees")
    department = relationship("Department", foreign_keys=[department_id], back_populates="employees")
    manager = relationship("Employee", remote_side=[id], foreign_keys=[manager_id])
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    payrolls = relationship("Payroll", back_populates="employee", cascade="all, delete-orphan")
    performance_reviews = relationship("PerformanceReview", foreign_keys="PerformanceReview.employee_id", back_populates="employee")
    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")
