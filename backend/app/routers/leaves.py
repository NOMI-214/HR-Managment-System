from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from app.database import get_db
from app.schemas.leave import LeaveCreate, LeaveApproval
from app.models.leave import LeaveRequest, LeaveBalance, LeaveStatus
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.core.dependencies import get_current_user, require_hr, require_tl
from app.services.email import send_leave_notification

router = APIRouter(prefix="/leaves", tags=["Leaves"])


def get_weekdays(start: date, end: date) -> int:
    total = 0
    current = start
    while current <= end:
        if current.weekday() < 5:
            total += 1
        current += timedelta(days=1)
    return total


def leave_to_dict(l):
    return {
        "id": l.id,
        "employee_id": l.employee_id,
        "company_id": l.company_id,
        "leave_type": l.leave_type,
        "start_date": l.start_date.isoformat(),
        "end_date": l.end_date.isoformat(),
        "days_requested": l.days_requested,
        "reason": l.reason,
        "status": l.status,
        "rejection_reason": l.rejection_reason,
        "tl_approved_at": l.tl_approved_at.isoformat() if l.tl_approved_at else None,
        "hr_approved_at": l.hr_approved_at.isoformat() if l.hr_approved_at else None,
        "created_at": l.created_at.isoformat()
    }


@router.post("", status_code=201)
async def apply_leave(
    data: LeaveCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    if data.start_date > data.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    days = get_weekdays(data.start_date, data.end_date)

    leave = LeaveRequest(
        employee_id=emp.id,
        company_id=emp.company_id,
        leave_type=data.leave_type,
        start_date=data.start_date,
        end_date=data.end_date,
        days_requested=days,
        reason=data.reason,
        status=LeaveStatus.PENDING
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return {
        "id": leave.id,
        "status": leave.status,
        "days_requested": days,
        "message": "Leave request submitted"
    }


@router.get("/my-leaves")
async def my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return []
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == emp.id
    ).order_by(LeaveRequest.created_at.desc()).all()
    return [leave_to_dict(l) for l in leaves]


@router.get("/pending")
async def pending_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tl)
):
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == current_user.company_id,
        LeaveRequest.status == LeaveStatus.PENDING
    ).all()
    return [leave_to_dict(l) for l in leaves]


@router.get("")
async def all_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == current_user.company_id
    ).order_by(LeaveRequest.created_at.desc()).all()
    return [leave_to_dict(l) for l in leaves]


@router.put("/{leave_id}/tl-action")
async def tl_action(
    leave_id: str,
    data: LeaveApproval,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tl)
):
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.company_id == current_user.company_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if data.action == "approve":
        leave.status = LeaveStatus.APPROVED_BY_TL
        leave.tl_approved_by = emp.id if emp else None
        leave.tl_approved_at = datetime.utcnow()
    else:
        leave.status = LeaveStatus.REJECTED
        leave.rejection_reason = data.rejection_reason

    db.commit()
    return {"message": f"Leave {data.action}d by Team Lead"}


@router.put("/{leave_id}/hr-action")
async def hr_action(
    leave_id: str,
    data: LeaveApproval,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    leave = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.company_id == current_user.company_id
    ).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    employee = db.query(Employee).filter(Employee.id == leave.employee_id).first()
    approver = db.query(Employee).filter(Employee.user_id == current_user.id).first()

    if data.action == "approve":
        leave.status = LeaveStatus.APPROVED
        leave.hr_approved_by = approver.id if approver else None
        leave.hr_approved_at = datetime.utcnow()
        if employee and employee.email:
            background_tasks.add_task(
                send_leave_notification,
                f"{employee.first_name} {employee.last_name}",
                employee.email,
                "APPROVED",
                leave.leave_type
            )
    else:
        leave.status = LeaveStatus.REJECTED
        leave.rejection_reason = data.rejection_reason
        if employee and employee.email:
            background_tasks.add_task(
                send_leave_notification,
                f"{employee.first_name} {employee.last_name}",
                employee.email,
                "REJECTED",
                leave.leave_type
            )

    db.commit()
    return {"message": f"Leave {data.action}d by HR"}
