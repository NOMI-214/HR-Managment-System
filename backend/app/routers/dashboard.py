from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models.employee import Employee, EmployeeStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus
from app.models.payroll import Payroll
from app.models.recruitment import JobPost, Candidate
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id
    now = datetime.utcnow()
    today = now.date()
    month_start = datetime(now.year, now.month, 1)

    total_employees = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.status == EmployeeStatus.ACTIVE
    ).count()

    new_hires = db.query(Employee).filter(
        Employee.company_id == company_id,
        Employee.joining_date >= month_start.date()
    ).count()

    today_present = db.query(Attendance).filter(
        Attendance.company_id == company_id,
        Attendance.date >= datetime.combine(today, datetime.min.time()),
        Attendance.date < datetime.combine(today + timedelta(days=1), datetime.min.time()),
        Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE])
    ).count()

    attendance_rate = round((today_present / total_employees * 100) if total_employees > 0 else 0, 1)

    pending_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == LeaveStatus.PENDING
    ).count()

    open_positions = db.query(JobPost).filter(
        JobPost.company_id == company_id,
        JobPost.status == "OPEN"
    ).count()

    total_payroll_records = db.query(Payroll).filter(
        Payroll.company_id == company_id,
        Payroll.month == now.month,
        Payroll.year == now.year
    ).all()
    payroll_cost = sum(float(p.net_salary) for p in total_payroll_records)

    on_leave_today = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == LeaveStatus.APPROVED,
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today
    ).count()

    return {
        "total_employees": total_employees,
        "new_hires_this_month": new_hires,
        "attendance_rate": attendance_rate,
        "today_present": today_present,
        "on_leave_today": on_leave_today,
        "pending_leaves": pending_leaves,
        "open_positions": open_positions,
        "monthly_payroll_cost": payroll_cost,
        "month": now.month,
        "year": now.year
    }


@router.get("/attendance-trend")
async def attendance_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id
    today = datetime.utcnow().date()
    result = []
    for i in range(7, 0, -1):
        day = today - timedelta(days=i - 1)
        total = db.query(Employee).filter(
            Employee.company_id == company_id,
            Employee.status == EmployeeStatus.ACTIVE
        ).count()
        present = db.query(Attendance).filter(
            Attendance.company_id == company_id,
            Attendance.date >= datetime.combine(day, datetime.min.time()),
            Attendance.date < datetime.combine(day + timedelta(days=1), datetime.min.time()),
            Attendance.status.in_([AttendanceStatus.PRESENT, AttendanceStatus.LATE])
        ).count()
        result.append({
            "date": day.strftime("%a"),
            "full_date": day.isoformat(),
            "present": present,
            "total": total,
            "rate": round((present / total * 100) if total > 0 else 0, 1)
        })
    return result


@router.get("/recent-activity")
async def recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.company_id
    now = datetime.utcnow()

    recent_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id
    ).order_by(LeaveRequest.created_at.desc()).limit(5).all()

    recent_employees = db.query(Employee).filter(
        Employee.company_id == company_id
    ).order_by(Employee.created_at.desc()).limit(5).all()

    activities = []
    for leave in recent_leaves:
        activities.append({
            "type": "leave_request",
            "message": f"Leave request submitted",
            "employee_id": leave.employee_id,
            "status": leave.status,
            "created_at": leave.created_at.isoformat()
        })

    for emp in recent_employees:
        activities.append({
            "type": "new_employee",
            "message": f"New employee joined: {emp.first_name} {emp.last_name}",
            "employee_id": emp.id,
            "created_at": emp.created_at.isoformat()
        })

    activities.sort(key=lambda x: x["created_at"], reverse=True)
    return activities[:10]


@router.get("/department-breakdown")
async def department_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.department import Department
    company_id = current_user.company_id

    departments = db.query(Department).filter(
        Department.company_id == company_id
    ).all()

    result = []
    for dept in departments:
        count = db.query(Employee).filter(
            Employee.department_id == dept.id,
            Employee.status == EmployeeStatus.ACTIVE
        ).count()
        result.append({
            "department": dept.name,
            "count": count
        })

    return result
