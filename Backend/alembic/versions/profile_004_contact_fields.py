"""profile contact fields and migration repair

Revision ID: profile_004_contact_fields
Revises: merge_001_discussion_into_chain
Create Date: 2026-05-20
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "profile_004_contact_fields"
down_revision: Union[str, Sequence[str], None] = "merge_001_discussion_into_chain"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(
    table_name: str,
    existing_columns: set[str],
    column: sa.Column,
) -> None:
    if column.name in existing_columns:
        return
    op.add_column(table_name, column)
    existing_columns.add(column.name)


def upgrade() -> None:
    user_profile_columns = _columns("user_profiles")
    _add_column_if_missing(
        "user_profiles",
        user_profile_columns,
        sa.Column("college", sa.String(length=150), nullable=True),
    )
    _add_column_if_missing(
        "user_profiles",
        user_profile_columns,
        sa.Column("college_year", sa.String(length=30), nullable=True),
    )
    _add_column_if_missing(
        "user_profiles",
        user_profile_columns,
        sa.Column("company", sa.String(length=150), nullable=True),
    )
    _add_column_if_missing(
        "user_profiles",
        user_profile_columns,
        sa.Column("dob", sa.Date(), nullable=True),
    )

    if op.get_bind().dialect.name == "postgresql":
        op.execute(
            "CREATE INDEX IF NOT EXISTS idx_mira_episodic_user_time "
            "ON mira_episodic (user_id, created_at DESC)"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS idx_mira_grading_user "
            "ON mira_grading_events (user_id, created_at DESC)"
        )
        op.execute(
            "CREATE INDEX IF NOT EXISTS idx_mira_appeal_pending "
            "ON mira_appeal_queue (status) WHERE status = 'pending'"
        )


def downgrade() -> None:
    user_profile_columns = _columns("user_profiles")
    if "company" in user_profile_columns:
        op.drop_column("user_profiles", "company")
    if "college" in user_profile_columns:
        op.drop_column("user_profiles", "college")
