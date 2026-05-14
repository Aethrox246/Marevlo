"""
Submission service.

`run`     — executes code without persisting.
`submit`  — executes, persists ProblemSubmission row, awards XP if accepted,
            re-evaluates achievements.
"""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.common.activity_log import ActivityLog
from app.core.exceptions import NotFound
from app.problems.models.problem import Problem
from app.profile.services.profile_service import XP_TABLE, profile_service
from app.submissions.models.submission import ProblemSubmission
from app.submissions.services.runner_client import runner_client

logger = logging.getLogger(__name__)


class SubmissionService:
    def run(self, *, language: str, code: str, stdin: str = "") -> dict:
        return runner_client.run(language=language, code=code, stdin=stdin)

    def submit(
        self,
        db: Session,
        *,
        user_id: int,
        problem_id: int,
        language: str,
        code: str,
        stdin: str = "",
    ) -> ProblemSubmission:
        problem = db.get(Problem, problem_id)
        if not problem:
            raise NotFound("Problem not found")

        # Run against provided test input (or empty if none provided)
        result = runner_client.run(language=language, code=code, stdin=stdin)
        status = "accepted" if result["exit_code"] == 0 else "rejected"

        submission = ProblemSubmission(
            user_id=user_id,
            problem_id=problem_id,
            language=language,
            status=status,
            execution_time=(result.get("runtime_ms") or 0) / 1000.0 if result.get("runtime_ms") else None,
        )
        db.add(submission)
        db.add(
            ActivityLog(
                user_id=user_id,
                action="submit_problem",
                meta={"problem_id": problem_id, "status": status, "language": language},
            )
        )
        db.commit()
        db.refresh(submission)

        if status == "accepted":
            xp = XP_TABLE.get(problem.difficulty or "Easy", XP_TABLE["Easy"])
            profile_service.award_xp(db, user_id=user_id, amount=xp)
            profile_service.evaluate_achievements(db, user_id)

        return submission


submission_service = SubmissionService()
