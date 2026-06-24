from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClockInRequest(BaseModel):
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    notes: Optional[str] = None


class ClockOutRequest(BaseModel):
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None


class AttendanceResponse(BaseModel):
    id: str
    employee_id: str
    company_id: str
    date: datetime
    clock_in: Optional[datetime]
    clock_out: Optional[datetime]
    break_start: Optional[datetime]
    break_end: Optional[datetime]
    work_hours: float
    overtime_hours: float
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True
