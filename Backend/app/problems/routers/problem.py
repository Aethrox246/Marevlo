"""Problems HTTP endpoints — read-only for end users."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.models.user import User
from app.core.dependencies import get_current_user, get_db
from app.problems.schemas.problem import ProblemDetail, ProblemSummary, TestCaseOut
from app.problems.services.problem_service import problem_service

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=List[ProblemSummary])
def list_problems(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    difficulty: Optional[str] = Query(None, pattern="^(Easy|Medium|Hard)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, _ = problem_service.list(db, page=page, limit=limit, difficulty=difficulty)
    return items


@router.get("/{problem_id}", response_model=ProblemDetail)
def get_problem(
    problem_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    problem, samples = problem_service.get_with_sample_testcases(db, problem_id)
    return ProblemDetail(
        id=problem.id,
        title=problem.title,
        slug=problem.slug,
        difficulty=problem.difficulty,
        created_at=problem.created_at,
        description=problem.description,
        sample_testcases=[TestCaseOut.model_validate(tc) for tc in samples],
    )
