"""
SQLAlchemy models for Course Reactions (like/dislike) and Course Comments.

Design follows the YouTube like/dislike pattern:
- A user can either LIKE or DISLIKE a course, never both.
- Toggling the same reaction removes it (un-vote).
- Switching from like→dislike (or vice versa) is an upsert.
- Enforced via composite PRIMARY KEY (user_id, course_id) on the reactions table.
"""

from sqlalchemy import (
    Column, Integer, String, Text, DateTime, CheckConstraint, ForeignKey, func,
)
from app.core.database import Base


class CourseReaction(Base):
    """
    YouTube-style like/dislike.

    PK = (user_id, course_id)  →  guarantees one vote per user per course.
    reaction_type is constrained to 'like' or 'dislike'.
    """
    __tablename__ = "course_reactions"

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    course_id = Column(String(128), primary_key=True)   # slug, e.g. "rag-module-0"
    reaction_type = Column(
        String(10),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint(
            "reaction_type IN ('like', 'dislike')",
            name="ck_course_reactions_type",
        ),
    )


class CourseComment(Base):
    """
    Community discussion comments on a course lesson.
    """
    __tablename__ = "course_comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id = Column(String(128), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
