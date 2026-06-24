from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PayrollCreate(BaseModel):
    employee_id: str
    month: int
    year: int
    basic_salary: float
    housing_allowance: float = 0
    transport_allowance: float = 0
    medical_allowance: float = 0
    other_allowances: float = 0
    bonus: float = 0
    income_tax: float = 0
    social_security: float = 0
    other_deductions: float = 0
    working_days: int = 26
    present_days: int = 26
    notes: Optional[str] = None


class PayrollResponse(BaseModel):
    id: str
    employee_id: str
    company_id: str
    month: int
    year: int
    basic_salary: float
    housing_allowance: float
    transport_allowance: float
    medical_allowance: float
    other_allowances: float
    bonus: float
    gross_salary: float
    income_tax: float
    social_security: float
    other_deductions: float
    total_deductions: float
    net_salary: float
    working_days: int
    present_days: int
    absent_days: int
    status: str
    paid_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
