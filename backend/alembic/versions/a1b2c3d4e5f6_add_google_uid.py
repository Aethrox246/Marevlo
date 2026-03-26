"""add google_uid and make password_hash nullable

Revision ID: a1b2c3d4e5f6
Revises: f53dcc3884a4
Create Date: 2026-03-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f53dcc3884a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add google_uid column (nullable, unique)
    op.add_column(
        'users',
        sa.Column('google_uid', sa.String(length=128), nullable=True)
    )
    op.create_unique_constraint('uq_users_google_uid', 'users', ['google_uid'])
    op.create_index('ix_users_google_uid', 'users', ['google_uid'], unique=True)

    # Make password_hash nullable to support Google-only (passwordless) accounts
    op.alter_column(
        'users',
        'password_hash',
        existing_type=sa.String(length=255),
        nullable=True,
    )


def downgrade() -> None:
    # Reverse: make password_hash NOT NULL again
    # NOTE: this will fail if any rows have NULL password_hash.
    # You must backfill a value before running downgrade.
    op.alter_column(
        'users',
        'password_hash',
        existing_type=sa.String(length=255),
        nullable=False,
    )

    # Remove google_uid index and column
    op.drop_index('ix_users_google_uid', table_name='users')
    op.drop_constraint('uq_users_google_uid', 'users', type_='unique')
    op.drop_column('users', 'google_uid')
