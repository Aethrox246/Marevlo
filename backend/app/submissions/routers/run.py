from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends
import requests

from app.core.dependencies import get_db
from app.core.config import IDE_API_URL
from app.submissions.models.submission import ProblemSubmission
from app.core.activity_model import ActivityLog


router = APIRouter()


@router.post("/run")
def run_code(payload: dict, db: Session = Depends(get_db)):

    # send code to IDE execution service
    response = requests.post(
        f"{IDE_API_URL}/api/nb/execute",
        json=payload,
        timeout=30
    )

    result = response.json()

    # Extract fields from payload
    user_id = payload.get("user_id")
    problem_id = payload.get("problem_id")
    language = payload.get("language")

    # Extract execution results
    status = result.get("status")
    passed = result.get("passed")
    exec_time = result.get("time")
    memory = result.get("memory")

    # Save submission
    submission = ProblemSubmission(
        user_id=user_id,
        problem_id=problem_id,
        language=language,
        status=status,
        test_cases_passed=passed,
        execution_time=exec_time,
        memory_used=memory
    )

    db.add(submission)
    db.commit()

    # Log activity
    log = ActivityLog(
        user_id=user_id,
        action="submit_problem",
        meta={
            "problem_id": problem_id,
            "status": status
        }
    )

    db.add(log)
    db.commit()

    return result


@router.post("/log")
def log_submission(payload: dict, db: Session = Depends(get_db)):
    user_id = payload.get("user_id")
    problem_id = payload.get("problem_id")
    language = payload.get("language")
    status = payload.get("status")
    passed = payload.get("passed")
    exec_time = payload.get("time")
    memory = payload.get("memory")

    if not user_id or not problem_id or not language or not status:
        return {"error": "Missing required fields"}

    submission = ProblemSubmission(
        user_id=user_id,
        problem_id=problem_id,
        language=language,
        status=status,
        test_cases_passed=passed,
        execution_time=exec_time,
        memory_used=memory
    )

    db.add(submission)
    db.commit()

    log = ActivityLog(
        user_id=user_id,
        action="submit_problem",
        meta={
            "problem_id": problem_id,
            "status": status
        }
    )

    db.add(log)
    db.commit()

    return {"message": "Submission logged"}
