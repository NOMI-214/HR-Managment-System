import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, Integer, Boolean, Date
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class JobStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    ON_HOLD = "ON_HOLD"


class JobType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    INTERNSHIP = "INTERNSHIP"


class CandidateStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    INTERVIEW = "INTERVIEW"
    TECHNICAL = "TECHNICAL"
    OFFER = "OFFER"
    HIRED = "HIRED"
    REJECTED = "REJECTED"


class JobPost(Base):
    __tablename__ = "job_posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    responsibilities = Column(Text, nullable=True)
    job_type = Column(Enum(JobType), default=JobType.FULL_TIME)
    status = Column(Enum(JobStatus), default=JobStatus.OPEN)
    location = Column(String(255), nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    experience_years = Column(Integer, default=0)
    deadline = Column(Date, nullable=True)
    posted_by = Column(String(36), ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidates = relationship("Candidate", back_populates="job_post", cascade="all, delete-orphan")
    interviews = relationship("Interview", back_populates="job_post", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    job_post_id = Column(String(36), ForeignKey("job_posts.id"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    resume_url = Column(String(500), nullable=True)
    cover_letter = Column(Text, nullable=True)
    status = Column(Enum(CandidateStatus), default=CandidateStatus.APPLIED)
    experience_years = Column(Integer, default=0)
    current_salary = Column(Integer, nullable=True)
    expected_salary = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    ai_score = Column(Integer, nullable=True)
    ai_skills_match = Column(Integer, nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    job_post = relationship("JobPost", back_populates="candidates")
    interviews = relationship("Interview", back_populates="candidate")


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id"), nullable=False)
    job_post_id = Column(String(36), ForeignKey("job_posts.id"), nullable=False)
    candidate_id = Column(String(36), ForeignKey("candidates.id"), nullable=False)
    interviewer_id = Column(String(36), ForeignKey("employees.id"), nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    interview_type = Column(String(50), default="VIDEO")
    meeting_link = Column(String(500), nullable=True)
    status = Column(String(50), default="SCHEDULED")
    feedback = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job_post = relationship("JobPost", back_populates="interviews")
    candidate = relationship("Candidate", back_populates="interviews")
