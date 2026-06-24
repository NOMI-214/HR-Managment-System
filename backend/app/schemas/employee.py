from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from enum import Enum


class EmployeeStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ON_LEAVE = "ON_LEAVE"
    TERMINATED = "TERMINATED"


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[str] = None
    manager_id: Optional[str] = None
    designation: Optional[str] = None
    employment_type: Optional[str] = "FULL_TIME"
    joining_date: Optional[date] = None
    salary: Optional[float] = 0
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    cnic: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None
    manager_id: Optional[str] = None
    designation: Optional[str] = None
    employment_type: Optional[str] = None
    joining_date: Optional[date] = None
    salary: Optional[float] = None
    status: Optional[EmployeeStatus] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    cnic: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None


class EmployeeResponse(BaseModel):
    id: str
    company_id: str
    department_id: Optional[str]
    manager_id: Optional[str]
    employee_id: Optional[str]
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    designation: Optional[str]
    employment_type: str
    status: str
    joining_date: Optional[date]
    salary: float
    avatar_url: Optional[str]
    gender: Optional[str]
    date_of_birth: Optional[date]
    address: Optional[str]
    city: Optional[str]
    country: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
