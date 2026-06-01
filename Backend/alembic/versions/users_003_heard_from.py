"""users: add heard_from column

Stores the signup source selected before registration.

Revision ID: users_003_heard_from
Revises: users_002_last_seen_at
Create Date: 2026-05-30
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "users_003_heard_from"
down_revision = "users_002_last_seen_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("heard_from", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "heard_from")