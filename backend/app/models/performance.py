import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Integer, Numeric
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class ReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    review_period = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=True)
    productivity_score = Column(Integer, default=0)
    communication_score = Column(Integer, default=0)
    teamwork_score = Column(Integer, default=0)
    attendance_score = Column(Integer, default=0)
    task_completion_score = Column(Integer, default=0)
    overall_score = Column(Numeric(5, 2), default=0)
    strengths = Column(Text, nullable=True)
    improvements = Column(Text, nullable=True)
    goals = Column(Text, nullable=True)
    comments = Column(Text, nullable=True)
    status = Column(Enum(ReviewStatus), default=ReviewStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id], back_populates="performance_reviews")
    reviewer = relationship("Employee", foreign_keys=[reviewer_id])


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String(36), ForeignKey("employees.id"), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(DateTime, nullable=True)
    progress = Column(Integer, default=0)
    status = Column(String(50), default="IN_PROGRESS")
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")
