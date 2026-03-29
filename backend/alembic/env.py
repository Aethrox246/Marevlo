from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
import os
from alembic import context

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from app.core.database import Base
from app.auth.models.user import User
from app.auth.models.session import UserSession
from app.auth.models.email_otp import EmailOTP
from app.profile.models.profile import UserProfile
from app.problems.models.problem import Problem
from app.problems.models.testcase import TestCase
from app.submissions.models.submission import ProblemSubmission
from app.feed.models.post import FeedPost, PostLike, Comment
from app.chat.models.chat import Chat, Message, MessageRead, Follow
from app.core.activity_model import ActivityLog
from app.profile.models.user_achievement import UserAchievement
target_metadata = Base.metadata

def get_url():
    return os.getenv("DATABASE_URL", "postgresql://algosphere:strongpassword@localhost:5432/algosphere_db")

def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
