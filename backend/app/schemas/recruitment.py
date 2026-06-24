from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime


class JobPostCreate(BaseModel):
    title: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    responsibilities: Optional[str] = None
    job_type: str = "FULL_TIME"
    department_id: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    experience_years: int = 0
    deadline: Optional[date] = None


class CandidateCreate(BaseModel):
    job_post_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    cover_letter: Optional[str] = None
    experience_years: int = 0
    current_salary: Optional[int] = None
    expected_salary: Optional[int] = None


class InterviewCreate(BaseModel):
    candidate_id: str
    job_post_id: str
    scheduled_at: datetime
    duration_minutes: int = 60
    interview_type: str = "VIDEO"
    meeting_link: Optional[str] = None
    interviewer_id: Optional[str] = None


class CandidateStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
