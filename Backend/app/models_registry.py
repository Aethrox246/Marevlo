"""
Central model registry.

Importing this module from app.main and alembic/env.py guarantees every
SQLAlchemy model is loaded into `Base.metadata`. Without this, Alembic's
autogenerate misses tables, and FK targets fail to resolve at runtime.
"""
# noqa: F401 — imports here are for side-effect (model registration).
from app.auth.models.user import EmailOTP, User, UserSession  # noqa: F401
from app.chat.models.chat import Chat, Follow, Message, MessageRead  # noqa: F401
from app.common.activity_log import ActivityLog  # noqa: F401
from app.common.security_event import SecurityEvent  # noqa: F401
from app.courses.models.course import CourseComment, CourseReaction  # noqa: F401
from app.feed.models.post import Post, PostComment, PostLike  # noqa: F401
from app.learning.models.learning import (  # noqa: F401
    CourseEnrollment,
    LessonBookmark,
    LessonNote,
    LessonProgress,
)
from app.moderation.models.moderation import (  # noqa: F401
    CommentReport,
    PostReport,
    UserBlock,
)
from app.notifications.models.notification import Notification  # noqa: F401
from app.problems.models.problem import Problem, ProblemTestCase  # noqa: F401
from app.profile.models.profile import UserAchievement, UserProfile  # noqa: F401
from app.submissions.models.submission import ProblemSubmission  # noqa: F401
from app.mira.models import db_models as _mira_db_models  # noqa: F401
