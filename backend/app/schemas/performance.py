from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    employee_id: str
    review_period: str
    year: int
    month: Optional[int] = None
    productivity_score: int = 0
    communication_score: int = 0
    teamwork_score: int = 0
    attendance_score: int = 0
    task_completion_score: int = 0
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    goals: Optional[str] = None
    comments: Optional[str] = None


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    progress: int = 0


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
