from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional
from app.database import get_db
from app.schemas.attendance import ClockInRequest, ClockOutRequest
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def get_my_employee(db: Session, current_user: User) -> Employee:
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


@router.post("/clock-in")
async def clock_in(
    data: ClockInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = get_my_employee(db, current_user)
    today = datetime.utcnow().date()

    existing = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= datetime.combine(today, datetime.min.time()),
        Attendance.date < datetime.combine(today + timedelta(days=1), datetime.min.time())
    ).first()

    if existing and existing.clock_in:
        raise HTTPException(status_code=400, detail="Already clocked in today")

    now = datetime.utcnow()
    is_late = now.hour >= 9 and now.minute > 15

    if not existing:
        record = Attendance(
            employee_id=emp.id,
            company_id=emp.company_id,
            date=datetime.combine(today, datetime.min.time()),
            clock_in=now,
            status=AttendanceStatus.LATE if is_late else AttendanceStatus.PRESENT,
            location_lat=data.location_lat,
            location_lng=data.location_lng,
            notes=data.notes
        )
        db.add(record)
    else:
        existing.clock_in = now
        existing.status = AttendanceStatus.LATE if is_late else AttendanceStatus.PRESENT

    db.commit()
    return {"message": "Clocked in successfully", "clock_in": now, "is_late": is_late}


@router.post("/clock-out")
async def clock_out(
    data: ClockOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = get_my_employee(db, current_user)
    today = datetime.utcnow().date()

    record = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= datetime.combine(today, datetime.min.time()),
        Attendance.date < datetime.combine(today + timedelta(days=1), datetime.min.time())
    ).first()

    if not record or not record.clock_in:
        raise HTTPException(status_code=400, detail="You haven't clocked in today")
    if record.clock_out:
        raise HTTPException(status_code=400, detail="Already clocked out")

    now = datetime.utcnow()
    record.clock_out = now

    work_seconds = (now - record.clock_in).total_seconds()
    if record.break_start and record.break_end:
        break_seconds = (record.break_end - record.break_start).total_seconds()
        work_seconds -= break_seconds

    work_hours = work_seconds / 3600
    record.work_hours = round(work_hours, 2)
    record.overtime_hours = round(max(0, work_hours - 8), 2)

    db.commit()
    return {"message": "Clocked out successfully", "clock_out": now, "work_hours": record.work_hours}


@router.post("/break-start")
async def break_start(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = get_my_employee(db, current_user)
    today = datetime.utcnow().date()
    record = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= datetime.combine(today, datetime.min.time())
    ).first()
    if not record or not record.clock_in:
        raise HTTPException(status_code=400, detail="Not clocked in")
    record.break_start = datetime.utcnow()
    db.commit()
    return {"message": "Break started", "break_start": record.break_start}


@router.post("/break-end")
async def break_end(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = get_my_employee(db, current_user)
    today = datetime.utcnow().date()
    record = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= datetime.combine(today, datetime.min.time())
    ).first()
    if not record or not record.break_start:
        raise HTTPException(status_code=400, detail="Break not started")
    record.break_end = datetime.utcnow()
    db.commit()
    return {"message": "Break ended", "break_end": record.break_end}


@router.get("/today")
async def get_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return None
    today = datetime.utcnow().date()
    record = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= datetime.combine(today, datetime.min.time()),
        Attendance.date < datetime.combine(today + timedelta(days=1), datetime.min.time())
    ).first()
    if not record:
        return None
    return {
        "id": record.id,
        "clock_in": record.clock_in,
        "clock_out": record.clock_out,
        "break_start": record.break_start,
        "break_end": record.break_end,
        "work_hours": float(record.work_hours) if record.work_hours else 0,
        "status": record.status
    }


@router.get("/my-history")
async def my_history(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = get_my_employee(db, current_user)
    now = datetime.utcnow()
    month = month or now.month
    year = year or now.year

    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1)
    else:
        end = datetime(year, month + 1, 1)

    records = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= start,
        Attendance.date < end
    ).order_by(Attendance.date).all()

    return [{
        "id": r.id,
        "date": r.date.isoformat(),
        "clock_in": r.clock_in.isoformat() if r.clock_in else None,
        "clock_out": r.clock_out.isoformat() if r.clock_out else None,
        "work_hours": float(r.work_hours) if r.work_hours else 0,
        "status": r.status,
        "overtime_hours": float(r.overtime_hours) if r.overtime_hours else 0
    } for r in records]


@router.get("/company-report")
async def company_report(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    month = month or now.month
    year = year or now.year
    start = datetime(year, month, 1)
    end = datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1)

    records = db.query(Attendance).filter(
        Attendance.company_id == current_user.company_id,
        Attendance.date >= start,
        Attendance.date < end
    ).all()

    total = len(records)
    present = sum(1 for r in records if r.status in ["PRESENT", "LATE"])
    return {
        "month": month,
        "year": year,
        "total_records": total,
        "present": present,
        "absent": sum(1 for r in records if r.status == "ABSENT"),
        "late": sum(1 for r in records if r.status == "LATE"),
        "attendance_rate": round((present / total * 100) if total > 0 else 0, 1)
    }
