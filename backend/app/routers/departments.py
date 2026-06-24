from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.models.department import Department
from app.models.employee import Employee
from app.models.user import User
from app.core.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("")
async def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    departments = db.query(Department).filter(Department.company_id == current_user.company_id).all()
    result = []
    for dept in departments:
        count = db.query(Employee).filter(Employee.department_id == dept.id).count()
        result.append({
            "id": dept.id,
            "company_id": dept.company_id,
            "name": dept.name,
            "description": dept.description,
            "manager_id": dept.manager_id,
            "employee_count": count,
            "created_at": dept.created_at.isoformat()
        })
    return result


@router.post("", status_code=201)
async def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    dept = Department(company_id=current_user.company_id, **data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {
        "id": dept.id,
        "name": dept.name,
        "description": dept.description,
        "manager_id": dept.manager_id,
        "created_at": dept.created_at
    }


@router.put("/{dept_id}")
async def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.company_id == current_user.company_id
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return {
        "id": dept.id,
        "name": dept.name,
        "description": dept.description,
        "manager_id": dept.manager_id
    }


@router.delete("/{dept_id}")
async def delete_department(
    dept_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    dept = db.query(Department).filter(
        Department.id == dept_id,
        Department.company_id == current_user.company_id
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}
