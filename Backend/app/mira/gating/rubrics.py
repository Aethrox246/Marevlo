"""Rubric service — load, validate, cache rubrics from Postgres."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.models.db_models import MiraRubric
from app.mira.models.schemas import Rubric, RubricType


class RubricService:
    """Load and cache rubrics. Latest version wins."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._cache: dict[tuple, tuple[int, Rubric]] = {}

    async def load(
        self,
        *,
        course_id: str,
        module_id: str,
        section_id: str | None,
        rubric_type: RubricType,
    ) -> tuple[int, Rubric] | None:
        """Returns (rubric_id, Rubric) or None."""
        cache_key = (course_id, module_id, section_id, rubric_type.value)
        if cache_key in self._cache:
            return self._cache[cache_key]

        stmt = (
            select(MiraRubric)
            .where(MiraRubric.course_id == course_id)
            .where(MiraRubric.module_id == module_id)
            .where(MiraRubric.rubric_type == rubric_type.value)
            .order_by(MiraRubric.version.desc())
            .limit(1)
        )
        if section_id is not None:
            stmt = stmt.where(MiraRubric.section_id == section_id)
        else:
            stmt = stmt.where(MiraRubric.section_id.is_(None))

        result = await self.db.execute(stmt)
        row = result.scalar_one_or_none()
        if not row:
            return None

        rubric = Rubric(**row.rubric_json)
        self._cache[cache_key] = (row.id, rubric)
        return row.id, rubric

    async def save(
        self,
        *,
        course_id: str,
        module_id: str,
        section_id: str | None,
        rubric_type: RubricType,
        rubric: Rubric,
        human_reviewed: bool = False,
    ) -> int:
        """Save a new version of a rubric. Returns the row id."""
        # Get next version number
        existing = await self.load(
            course_id=course_id, module_id=module_id,
            section_id=section_id, rubric_type=rubric_type,
        )
        next_version = 1
        if existing:
            # Look up the actual version number from the loaded row
            stmt = (
                select(MiraRubric.version)
                .where(MiraRubric.id == existing[0])
            )
            res = await self.db.execute(stmt)
            current_v = res.scalar_one()
            next_version = current_v + 1

        row = MiraRubric(
            course_id=course_id,
            module_id=module_id,
            section_id=section_id,
            rubric_type=rubric_type.value,
            rubric_json=rubric.model_dump(mode="json"),
            version=next_version,
            human_reviewed=human_reviewed,
        )
        self.db.add(row)
        await self.db.flush()

        # Clear cache for this key
        cache_key = (course_id, module_id, section_id, rubric_type.value)
        self._cache.pop(cache_key, None)

        return row.id
