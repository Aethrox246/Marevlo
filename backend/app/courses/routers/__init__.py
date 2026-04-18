"""
Course engagement endpoints — reactions (like/dislike) and comments.

YouTube-style voting rules:
  - A user can LIKE or DISLIKE a course, never both (composite PK enforces this).
  - Clicking the same reaction again removes it (toggle off).
  - Switching from like → dislike (or vice versa) replaces the existing vote.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.core.dependencies import get_db, get_current_user
from app.auth.models.user import User
from app.auth.utils.security import decode_token
from app.courses.models import CourseReaction, CourseComment
from app.courses.schemas import (
    ReactRequest,
    ReactionsResponse,
    CommentCreate,
    CommentOut,
    CommentsPage,
)

router = APIRouter(prefix="/courses", tags=["courses"])
logger = logging.getLogger("courses")


# ── Helper: optional current user (no 401 if unauthenticated) ─────
def _get_optional_user(request: Request, db: Session = Depends(get_db)):
    """Return the User if a valid token is present, else None."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]
    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub", 0))
        if not user_id:
            return None
        return db.get(User, user_id)
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────────
#  REACTIONS
# ──────────────────────────────────────────────────────────────────

def _count_reactions(db: Session, course_id: str) -> dict:
    """Return {"likes": int, "dislikes": int} for a course."""
    rows = (
        db.execute(
            select(
                CourseReaction.reaction_type,
                func.count().label("cnt"),
            )
            .where(CourseReaction.course_id == course_id)
            .group_by(CourseReaction.reaction_type)
        )
        .all()
    )
    counts = {"likes": 0, "dislikes": 0}
    for rtype, cnt in rows:
        if rtype == "like":
            counts["likes"] = cnt
        elif rtype == "dislike":
            counts["dislikes"] = cnt
    return counts


@router.get("/{course_id}/reactions", response_model=ReactionsResponse)
def get_reactions(
    course_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public endpoint — returns like/dislike counts.
    If an Authorization header is present, also returns the caller's vote.
    """
    counts = _count_reactions(db, course_id)

    my_reaction = None
    user = _get_optional_user(request, db)
    if user:
        row = db.execute(
            select(CourseReaction.reaction_type)
            .where(CourseReaction.user_id == user.id)
            .where(CourseReaction.course_id == course_id)
        ).scalar_one_or_none()
        my_reaction = row

    return ReactionsResponse(
        likes=counts["likes"],
        dislikes=counts["dislikes"],
        reaction=my_reaction,
        my_reaction=my_reaction,
    )


@router.post("/{course_id}/react", response_model=ReactionsResponse)
def react_to_course(
    course_id: str,
    body: ReactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Toggle a like/dislike on a course (YouTube-style).

    Logic:
      - If no existing vote → insert.
      - If same vote exists → remove it  (toggle off).
      - If opposite vote exists → switch it (upsert).
    """
    existing = db.execute(
        select(CourseReaction)
        .where(CourseReaction.user_id == current_user.id)
        .where(CourseReaction.course_id == course_id)
    ).scalar_one_or_none()

    if existing is None:
        # No vote yet → insert new reaction
        db.add(CourseReaction(
            user_id=current_user.id,
            course_id=course_id,
            reaction_type=body.type,
        ))
        new_reaction = body.type
    elif existing.reaction_type == body.type:
        # Same vote → toggle OFF (remove)
        db.delete(existing)
        new_reaction = None
    else:
        # Opposite vote → switch
        existing.reaction_type = body.type
        new_reaction = body.type

    db.commit()

    counts = _count_reactions(db, course_id)
    return ReactionsResponse(
        likes=counts["likes"],
        dislikes=counts["dislikes"],
        reaction=new_reaction,
        my_reaction=new_reaction,
    )


# ──────────────────────────────────────────────────────────────────
#  COMMENTS
# ──────────────────────────────────────────────────────────────────

@router.get("/{course_id}/comments", response_model=CommentsPage)
def list_comments(
    course_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Paginated comments for a course, newest first."""
    offset = (page - 1) * limit

    rows = (
        db.execute(
            select(CourseComment, User.username)
            .join(User, User.id == CourseComment.user_id)
            .where(CourseComment.course_id == course_id)
            .order_by(CourseComment.created_at.desc())
            .offset(offset)
            .limit(limit + 1)  # fetch one extra to check if there's more
        )
        .all()
    )

    has_more = len(rows) > limit
    rows = rows[:limit]

    comments = [
        CommentOut(
            id=comment.id,
            author=username,
            user_id=comment.user_id,
            content=comment.content,
            created_at=comment.created_at,
        )
        for comment, username in rows
    ]

    return CommentsPage(comments=comments, has_more=has_more)


@router.post(
    "/{course_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    course_id: str,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Post a new comment on a course."""
    comment = CourseComment(
        user_id=current_user.id,
        course_id=course_id,
        content=body.content.strip(),
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentOut(
        id=comment.id,
        author=current_user.username,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
    )


@router.delete(
    "/{course_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(
    course_id: str,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete own comment. Only the author can delete."""
    comment = db.get(CourseComment, comment_id)
    if not comment or comment.course_id != course_id:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")

    db.delete(comment)
    db.commit()
