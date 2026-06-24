from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    manager_id: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    company_id: str
    name: str
    description: Optional[str]
    manager_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
