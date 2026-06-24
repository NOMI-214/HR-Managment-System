import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Enum, Text
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    HALF_DAY = "HALF_DAY"
    ON_LEAVE = "ON_LEAVE"
    HOLIDAY = "HOLIDAY"


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    clock_in = Column(DateTime, nullable=True)
    clock_out = Column(DateTime, nullable=True)
    break_start = Column(DateTime, nullable=True)
    break_end = Column(DateTime, nullable=True)
    work_hours = Column(Numeric(5, 2), default=0)
    overtime_hours = Column(Numeric(5, 2), default=0)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    notes = Column(Text, nullable=True)
    location_lat = Column(Numeric(10, 8), nullable=True)
    location_lng = Column(Numeric(11, 8), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="attendance_records")
