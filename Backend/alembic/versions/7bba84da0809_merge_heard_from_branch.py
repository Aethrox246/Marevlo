"""merge heard_from branch

Revision ID: 7bba84da0809
Revises: a1b2c3d4e5f6, users_003_heard_from
Create Date: 2026-05-30 17:30:14.856920

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7bba84da0809'
down_revision: Union[str, None] = ('a1b2c3d4e5f6', 'users_003_heard_from')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
