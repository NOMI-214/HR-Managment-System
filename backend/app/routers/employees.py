from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from app.database import get_db
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.models.employee import Employee, EmployeeStatus
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user, require_admin, require_hr
import os
import aiofiles

router = APIRouter(prefix="/employees", tags=["Employees"])


def emp_to_dict(e: Employee):
    return {
        "id": e.id,
        "company_id": e.company_id,
        "department_id": e.department_id,
        "manager_id": e.manager_id,
        "employee_id": e.employee_id,
        "first_name": e.first_name,
        "last_name": e.last_name,
        "full_name": f"{e.first_name} {e.last_name}",
        "email": e.email,
        "phone": e.phone,
        "designation": e.designation,
        "employment_type": e.employment_type,
        "status": e.status,
        "joining_date": e.joining_date.isoformat() if e.joining_date else None,
        "salary": float(e.salary) if e.salary else 0,
        "avatar_url": e.avatar_url,
        "gender": e.gender,
        "city": e.city,
        "country": e.country,
        "date_of_birth": e.date_of_birth.isoformat() if e.date_of_birth else None,
        "address": e.address,
        "cnic": e.cnic,
        "emergency_contact_name": e.emergency_contact_name,
        "emergency_contact_phone": e.emergency_contact_phone,
        "bank_account": e.bank_account,
        "bank_name": e.bank_name,
        "created_at": e.created_at.isoformat()
    }


@router.get("")
async def list_employees(
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Employee).filter(Employee.company_id == current_user.company_id)
    if search:
        query = query.filter(
            (Employee.first_name.ilike(f"%{search}%")) |
            (Employee.last_name.ilike(f"%{search}%")) |
            (Employee.email.ilike(f"%{search}%")) |
            (Employee.designation.ilike(f"%{search}%"))
        )
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if status:
        query = query.filter(Employee.status == status)

    total = query.count()
    employees = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": [emp_to_dict(e) for e in employees]
    }


@router.post("", status_code=201)
async def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    employee_count = str(db.query(Employee).filter(Employee.company_id == current_user.company_id).count() + 1).zfill(4)
    emp = Employee(
        company_id=current_user.company_id,
        employee_id=f"EMP{employee_count}",
        **data.model_dump()
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp_to_dict(emp)


@router.get("/{employee_id}")
async def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp_to_dict(emp)


@router.put("/{employee_id}")
async def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(emp, key, val)
    db.commit()
    db.refresh(emp)
    return emp_to_dict(emp)


@router.delete("/{employee_id}")
async def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.status = EmployeeStatus.TERMINATED
    db.commit()
    return {"message": "Employee deactivated"}


@router.post("/{employee_id}/avatar")
async def upload_avatar(
    employee_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    upload_dir = "./uploads/avatars"
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{employee_id}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    emp.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    return {"avatar_url": emp.avatar_url}
