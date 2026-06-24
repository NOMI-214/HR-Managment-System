from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.recruitment import JobPostCreate, CandidateCreate, InterviewCreate, CandidateStatusUpdate
from app.models.recruitment import JobPost, Candidate, Interview, JobStatus
from app.models.user import User
from app.core.dependencies import get_current_user, require_hr
import os
import aiofiles
import uuid

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])


def job_to_dict(j, db=None):
    candidate_count = 0
    if db:
        candidate_count = db.query(Candidate).filter(Candidate.job_post_id == j.id).count()
    return {
        "id": j.id,
        "company_id": j.company_id,
        "department_id": j.department_id,
        "title": j.title,
        "description": j.description,
        "requirements": j.requirements,
        "responsibilities": j.responsibilities,
        "job_type": j.job_type,
        "status": j.status,
        "location": j.location,
        "salary_min": j.salary_min,
        "salary_max": j.salary_max,
        "experience_years": j.experience_years,
        "deadline": j.deadline.isoformat() if j.deadline else None,
        "candidate_count": candidate_count,
        "created_at": j.created_at.isoformat()
    }


def cand_to_dict(c):
    return {
        "id": c.id,
        "job_post_id": c.job_post_id,
        "company_id": c.company_id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "status": c.status,
        "experience_years": c.experience_years,
        "current_salary": c.current_salary,
        "expected_salary": c.expected_salary,
        "ai_score": c.ai_score,
        "ai_skills_match": c.ai_skills_match,
        "notes": c.notes,
        "resume_url": c.resume_url,
        "applied_at": c.applied_at.isoformat()
    }


@router.get("/jobs")
async def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jobs = db.query(JobPost).filter(
        JobPost.company_id == current_user.company_id
    ).order_by(JobPost.created_at.desc()).all()
    return [job_to_dict(j, db) for j in jobs]


@router.post("/jobs", status_code=201)
async def create_job(
    data: JobPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    job = JobPost(company_id=current_user.company_id, **data.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job_to_dict(job)


@router.get("/jobs/{job_id}")
async def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(JobPost).filter(
        JobPost.id == job_id,
        JobPost.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_dict(job, db)


@router.put("/jobs/{job_id}")
async def update_job(
    job_id: str,
    data: JobPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    job = db.query(JobPost).filter(
        JobPost.id == job_id,
        JobPost.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(job, k, v)
    db.commit()
    return job_to_dict(job)


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    job = db.query(JobPost).filter(
        JobPost.id == job_id,
        JobPost.company_id == current_user.company_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.status = JobStatus.CLOSED
    db.commit()
    return {"message": "Job closed"}


@router.get("/candidates")
async def list_candidates(
    job_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    query = db.query(Candidate).filter(Candidate.company_id == current_user.company_id)
    if job_id:
        query = query.filter(Candidate.job_post_id == job_id)
    candidates = query.order_by(Candidate.applied_at.desc()).all()
    return [cand_to_dict(c) for c in candidates]


@router.post("/candidates", status_code=201)
async def add_candidate(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    cand = Candidate(company_id=current_user.company_id, **data.model_dump())
    db.add(cand)
    db.commit()
    db.refresh(cand)
    return cand_to_dict(cand)


@router.get("/candidates/{cand_id}")
async def get_candidate(
    cand_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    cand = db.query(Candidate).filter(
        Candidate.id == cand_id,
        Candidate.company_id == current_user.company_id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand_to_dict(cand)


@router.put("/candidates/{cand_id}/status")
async def update_candidate_status(
    cand_id: str,
    data: CandidateStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    cand = db.query(Candidate).filter(
        Candidate.id == cand_id,
        Candidate.company_id == current_user.company_id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    cand.status = data.status
    if data.notes:
        cand.notes = data.notes
    db.commit()
    return cand_to_dict(cand)


@router.post("/candidates/{cand_id}/resume")
async def upload_resume(
    cand_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    cand = db.query(Candidate).filter(
        Candidate.id == cand_id,
        Candidate.company_id == current_user.company_id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    upload_dir = "./uploads/resumes"
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "pdf"
    filename = f"{cand_id}_{uuid.uuid4()}.{ext}"
    filepath = os.path.join(upload_dir, filename)

    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)

    cand.resume_url = f"/uploads/resumes/{filename}"
    db.commit()
    return {"resume_url": cand.resume_url}


@router.post("/interviews", status_code=201)
async def schedule_interview(
    data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    interview = Interview(company_id=current_user.company_id, **data.model_dump())
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return {
        "id": interview.id,
        "candidate_id": interview.candidate_id,
        "job_post_id": interview.job_post_id,
        "scheduled_at": interview.scheduled_at,
        "duration_minutes": interview.duration_minutes,
        "interview_type": interview.interview_type,
        "meeting_link": interview.meeting_link,
        "status": interview.status
    }


@router.get("/interviews")
async def list_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    interviews = db.query(Interview).filter(
        Interview.company_id == current_user.company_id
    ).all()
    return [{
        "id": i.id,
        "candidate_id": i.candidate_id,
        "job_post_id": i.job_post_id,
        "scheduled_at": i.scheduled_at,
        "duration_minutes": i.duration_minutes,
        "interview_type": i.interview_type,
        "meeting_link": i.meeting_link,
        "status": i.status,
        "feedback": i.feedback,
        "rating": i.rating
    } for i in interviews]
