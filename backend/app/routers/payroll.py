from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.payroll import PayrollCreate
from app.models.payroll import Payroll, PayrollStatus
from app.models.employee import Employee
from app.models.user import User
from app.core.dependencies import get_current_user, require_admin, require_hr
from datetime import datetime

router = APIRouter(prefix="/payroll", tags=["Payroll"])


def calculate_payroll(data: PayrollCreate) -> dict:
    gross = (
        data.basic_salary
        + data.housing_allowance
        + data.transport_allowance
        + data.medical_allowance
        + data.other_allowances
        + data.bonus
    )
    total_deductions = data.income_tax + data.social_security + data.other_deductions
    net = gross - total_deductions
    absent_days = data.working_days - data.present_days
    return {
        "gross_salary": round(gross, 2),
        "total_deductions": round(total_deductions, 2),
        "net_salary": round(net, 2),
        "absent_days": absent_days
    }


def payroll_to_dict(p):
    return {
        "id": p.id,
        "employee_id": p.employee_id,
        "company_id": p.company_id,
        "month": p.month,
        "year": p.year,
        "basic_salary": float(p.basic_salary),
        "housing_allowance": float(p.housing_allowance),
        "transport_allowance": float(p.transport_allowance),
        "medical_allowance": float(p.medical_allowance),
        "other_allowances": float(p.other_allowances),
        "bonus": float(p.bonus),
        "gross_salary": float(p.gross_salary),
        "income_tax": float(p.income_tax),
        "social_security": float(p.social_security),
        "other_deductions": float(p.other_deductions),
        "total_deductions": float(p.total_deductions),
        "net_salary": float(p.net_salary),
        "working_days": p.working_days,
        "present_days": p.present_days,
        "absent_days": p.absent_days,
        "status": p.status,
        "notes": p.notes,
        "paid_at": p.paid_at.isoformat() if p.paid_at else None,
        "created_at": p.created_at.isoformat()
    }


@router.post("", status_code=201)
async def create_payroll(
    data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    existing = db.query(Payroll).filter(
        Payroll.employee_id == data.employee_id,
        Payroll.month == data.month,
        Payroll.year == data.year,
        Payroll.company_id == current_user.company_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already exists for this period")

    calc = calculate_payroll(data)
    payroll = Payroll(
        company_id=current_user.company_id,
        **data.model_dump(),
        **calc
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)
    return payroll_to_dict(payroll)


@router.get("")
async def list_payrolls(
    month: Optional[int] = None,
    year: Optional[int] = None,
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    query = db.query(Payroll).filter(Payroll.company_id == current_user.company_id)
    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)
    if employee_id:
        query = query.filter(Payroll.employee_id == employee_id)
    payrolls = query.order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    return [payroll_to_dict(p) for p in payrolls]


@router.get("/my-payslips")
async def my_payslips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return []
    payrolls = db.query(Payroll).filter(
        Payroll.employee_id == emp.id
    ).order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    return [payroll_to_dict(p) for p in payrolls]


@router.put("/{payroll_id}/mark-paid")
async def mark_paid(
    payroll_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    p = db.query(Payroll).filter(
        Payroll.id == payroll_id,
        Payroll.company_id == current_user.company_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll not found")
    p.status = PayrollStatus.PAID
    p.paid_at = datetime.utcnow()
    db.commit()
    return {"message": "Marked as paid"}


@router.get("/{payroll_id}")
async def get_payroll(
    payroll_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    p = db.query(Payroll).filter(
        Payroll.id == payroll_id,
        Payroll.company_id == current_user.company_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Payroll not found")
    return payroll_to_dict(p)
