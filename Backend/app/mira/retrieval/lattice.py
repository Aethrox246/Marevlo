"""Concept lattice loader and prerequisite traversal.

A ConceptLattice is a DAG of concepts for a course. Given a user's beliefs
and a concept they're currently asking about, we can:
  1. Find which prerequisites they haven't mastered (gap finder)
  2. Traverse the lattice to build dependency order for explanations
  3. Identify the "frontier" — concepts where p_known is in [0.3, 0.7]
     (the learning edge where they're ready but not yet mastered)

No LLM calls. Pure graph algorithms over JSONB lattice data.
"""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.models.db_models import MiraConceptLattice
from app.mira.models.schemas import Concept, ConceptBelief, ConceptLattice


@dataclass
class PrerequisiteGap:
    """A prerequisite the user hasn't mastered."""
    concept_id: str
    concept_name: str
    current_p_known: float
    distance: int  # hops from the target concept (1 = direct prereq)


class LatticeService:
    """Stateless graph operations on a ConceptLattice."""

    @staticmethod
    def find_prerequisite_gaps(
        lattice: ConceptLattice,
        target_concept_id: str,
        user_beliefs: dict[str, ConceptBelief],
        mastery_threshold: float = 0.6,
        max_depth: int = 3,
    ) -> list[PrerequisiteGap]:
        """Walk prereq edges backward from target. Return concepts where
        user's p_known is below mastery_threshold.
        """
        if target_concept_id not in lattice.concepts:
            return []

        gaps: list[PrerequisiteGap] = []
        visited: set[str] = set()
        queue: deque[tuple[str, int]] = deque([(target_concept_id, 0)])

        while queue:
            concept_id, depth = queue.popleft()
            if concept_id in visited or depth > max_depth:
                continue
            visited.add(concept_id)

            concept = lattice.concepts.get(concept_id)
            if not concept:
                continue

            for prereq_id in concept.prerequisites:
                if prereq_id in visited:
                    continue
                prereq = lattice.concepts.get(prereq_id)
                if not prereq:
                    continue

                belief = user_beliefs.get(prereq_id)
                p = belief.p_known if belief else 0.2

                if p < mastery_threshold:
                    gaps.append(
                        PrerequisiteGap(
                            concept_id=prereq_id,
                            concept_name=prereq.name,
                            current_p_known=p,
                            distance=depth + 1,
                        )
                    )
                # Recurse regardless of mastery — further ancestors may be gaps
                queue.append((prereq_id, depth + 1))

        # Sort: nearest gaps first, then lowest p_known
        gaps.sort(key=lambda g: (g.distance, g.current_p_known))
        return gaps

    @staticmethod
    def find_learning_frontier(
        lattice: ConceptLattice,
        user_beliefs: dict[str, ConceptBelief],
        min_p: float = 0.3,
        max_p: float = 0.7,
    ) -> list[Concept]:
        """Concepts where the user is actively learning (not mastered, not
        completely unknown). These are the natural "next things to study".
        """
        frontier = []
        for concept_id, concept in lattice.concepts.items():
            belief = user_beliefs.get(concept_id)
            if not belief:
                continue
            if min_p <= belief.p_known <= max_p:
                # Also require prereqs to be mostly mastered
                prereqs_ready = all(
                    user_beliefs.get(p, _default_belief()).p_known >= 0.6
                    for p in concept.prerequisites
                )
                if prereqs_ready or not concept.prerequisites:
                    frontier.append(concept)
        return frontier

    @staticmethod
    def topological_explanation_order(
        lattice: ConceptLattice,
        concept_ids: list[str],
    ) -> list[str]:
        """Given a set of concepts to explain, return them in prerequisite
        order. Concept A comes before B if A is (transitively) in B's prereqs.
        """
        requested = set(concept_ids)
        visited: set[str] = set()
        order: list[str] = []

        def visit(cid: str):
            if cid in visited or cid not in lattice.concepts:
                return
            visited.add(cid)
            concept = lattice.concepts[cid]
            for prereq in concept.prerequisites:
                if prereq in requested:
                    visit(prereq)
            order.append(cid)

        for cid in concept_ids:
            visit(cid)
        return order

    @staticmethod
    def overall_mastery(
        lattice: ConceptLattice,
        user_beliefs: dict[str, ConceptBelief],
    ) -> float:
        """Average mastery across all concepts the lattice contains.

        Returns 0.0 if no beliefs exist for any lattice concept.
        Concepts in the lattice with no belief are treated as 0.2 (prior).
        """
        if not lattice.concepts:
            return 0.0
        total = 0.0
        for cid in lattice.concepts:
            belief = user_beliefs.get(cid)
            total += belief.p_known if belief else 0.2
        return total / len(lattice.concepts)


def _default_belief() -> ConceptBelief:
    return ConceptBelief(concept_id="_default")


class LatticeLoader:
    """Loads lattices from Postgres. Caches the most recent version per
    course/module."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._cache: dict[tuple[str, str | None], ConceptLattice] = {}

    async def load(
        self,
        course_id: str,
        module_id: str | None = None,
    ) -> ConceptLattice | None:
        """Load the latest version of a lattice, preferring module-specific
        over course-level."""
        cache_key = (course_id, module_id)
        if cache_key in self._cache:
            return self._cache[cache_key]

        stmt = (
            select(MiraConceptLattice)
            .where(MiraConceptLattice.course_id == course_id)
            .where(MiraConceptLattice.module_id == module_id)
            .order_by(MiraConceptLattice.version.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        row = result.scalar_one_or_none()
        if not row:
            # Fall back to course-level if module-specific missing
            if module_id is not None:
                return await self.load(course_id, None)
            return None

        lattice = ConceptLattice(**row.lattice)
        self._cache[cache_key] = lattice
        return lattice

    def clear_cache(self):
        self._cache.clear()
