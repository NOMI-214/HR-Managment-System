from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.performance import ReviewCreate, GoalCreate, GoalUpdate
from app.models.performance import PerformanceReview, Goal, ReviewStatus
from app.models.employee import Employee
from app.models.user import User
from app.core.dependencies import get_current_user, require_hr

router = APIRouter(prefix="/performance", tags=["Performance"])


def review_to_dict(r):
    return {
        "id": r.id,
        "employee_id": r.employee_id,
        "reviewer_id": r.reviewer_id,
        "company_id": r.company_id,
        "review_period": r.review_period,
        "year": r.year,
        "month": r.month,
        "productivity_score": r.productivity_score,
        "communication_score": r.communication_score,
        "teamwork_score": r.teamwork_score,
        "attendance_score": r.attendance_score,
        "task_completion_score": r.task_completion_score,
        "overall_score": float(r.overall_score),
        "strengths": r.strengths,
        "improvements": r.improvements,
        "goals": r.goals,
        "comments": r.comments,
        "status": r.status,
        "created_at": r.created_at.isoformat()
    }


@router.post("/reviews", status_code=201)
async def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hr)
):
    reviewer = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not reviewer:
        raise HTTPException(
            status_code=422,
            detail="Your user account has no employee profile. Ask an admin to create one for you before submitting reviews."
        )

    scores = [
        data.productivity_score,
        data.communication_score,
        data.teamwork_score,
        data.attendance_score,
        data.task_completion_score
    ]
    overall = sum(scores) / len(scores)

    review = PerformanceReview(
        company_id=current_user.company_id,
        reviewer_id=reviewer.id,
        overall_score=round(overall, 2),
        **data.model_dump()
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review_to_dict(review)


@router.get("/reviews")
async def list_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(PerformanceReview).filter(
        PerformanceReview.company_id == current_user.company_id
    )
    reviews = query.order_by(PerformanceReview.created_at.desc()).all()
    return [review_to_dict(r) for r in reviews]


@router.get("/reviews/{review_id}")
async def get_review(
    review_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    review = db.query(PerformanceReview).filter(
        PerformanceReview.id == review_id,
        PerformanceReview.company_id == current_user.company_id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review_to_dict(review)


@router.get("/my-reviews")
async def my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return []
    reviews = db.query(PerformanceReview).filter(
        PerformanceReview.employee_id == emp.id
    ).all()
    return [review_to_dict(r) for r in reviews]


@router.post("/goals", status_code=201)
async def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(
            status_code=422,
            detail="Your user account has no employee profile. Ask an admin to create one for you before setting goals."
        )
    goal = Goal(employee_id=emp.id, company_id=emp.company_id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return {
        "id": goal.id,
        "title": goal.title,
        "description": goal.description,
        "progress": goal.progress,
        "status": goal.status,
        "target_date": goal.target_date.isoformat() if goal.target_date else None,
        "created_at": goal.created_at.isoformat()
    }


@router.get("/goals")
async def my_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return []
    goals = db.query(Goal).filter(Goal.employee_id == emp.id).all()
    return [{
        "id": g.id,
        "title": g.title,
        "description": g.description,
        "progress": g.progress,
        "status": g.status,
        "target_date": g.target_date.isoformat() if g.target_date else None,
        "created_at": g.created_at.isoformat()
    } for g in goals]


@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: str,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(
            status_code=422,
            detail="Your user account has no employee profile. Ask an admin to create one for you."
        )
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.employee_id == emp.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(goal, k, v)
    db.commit()
    return {
        "id": goal.id,
        "title": goal.title,
        "progress": goal.progress,
        "status": goal.status
    }


@router.delete("/goals/{goal_id}")
async def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(
            status_code=422,
            detail="Your user account has no employee profile. Ask an admin to create one for you."
        )
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.employee_id == emp.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}
