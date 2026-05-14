"""Vector store abstraction — Qdrant in production, in-memory for tests.

Same interface for both. In production, we instantiate QdrantVectorStore
with the Qdrant container's URL. In tests, we use InMemoryVectorStore which
computes cosine similarity in Python — slow but fine for 100s of chunks.

When the user buys API credits and runs real Qdrant, only the app's
startup wiring changes. Every downstream module uses VectorStore as
an abstract dependency.
"""
from __future__ import annotations

import asyncio
import math
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


# ===========================================================================
# TYPES
# ===========================================================================

@dataclass
class ChunkPayload:
    """One chunk's metadata + text as stored in Qdrant."""
    chunk_id: str
    source_type: str      # "course" | "dsa" | "paper"
    course_id: str
    module_id: str | None = None
    section_id: str | None = None
    chunk_index: int = 0
    chunk_type: str = "prose"   # prose | code | example | formula
    concept_ids: list[str] = field(default_factory=list)
    text: str = ""
    heading_trail: list[str] = field(default_factory=list)
    difficulty: float = 0.5
    has_code: bool = False
    has_diagram: bool = False
    content_hash: str = ""

    def to_qdrant_payload(self) -> dict[str, Any]:
        """Flatten for Qdrant point payload."""
        return {
            "chunk_id": self.chunk_id,
            "source_type": self.source_type,
            "course_id": self.course_id,
            "module_id": self.module_id,
            "section_id": self.section_id,
            "chunk_index": self.chunk_index,
            "chunk_type": self.chunk_type,
            "concept_ids": self.concept_ids,
            "text": self.text,
            "heading_trail": self.heading_trail,
            "difficulty": self.difficulty,
            "has_code": self.has_code,
            "has_diagram": self.has_diagram,
            "content_hash": self.content_hash,
        }

    @classmethod
    def from_qdrant_payload(cls, payload: dict[str, Any]) -> "ChunkPayload":
        return cls(**{k: v for k, v in payload.items() if k in cls.__dataclass_fields__})


@dataclass
class SearchResult:
    """One match from a vector search."""
    chunk: ChunkPayload
    score: float  # cosine similarity, 0..1


@dataclass
class SearchFilter:
    """Metadata constraints applied before vector similarity."""
    course_id: str | None = None
    module_id: str | None = None
    section_id: str | None = None
    source_type: str | None = None
    min_difficulty: float | None = None
    max_difficulty: float | None = None

    def matches(self, chunk: ChunkPayload) -> bool:
        """Used by InMemoryVectorStore to filter candidates."""
        if self.course_id and chunk.course_id != self.course_id:
            return False
        if self.module_id and chunk.module_id != self.module_id:
            return False
        if self.section_id and chunk.section_id != self.section_id:
            return False
        if self.source_type and chunk.source_type != self.source_type:
            return False
        if self.min_difficulty is not None and chunk.difficulty < self.min_difficulty:
            return False
        if self.max_difficulty is not None and chunk.difficulty > self.max_difficulty:
            return False
        return True


# ===========================================================================
# ABSTRACT INTERFACE
# ===========================================================================

class VectorStore(ABC):
    """Interface implemented by both Qdrant and in-memory backends."""

    @abstractmethod
    async def ensure_collection(self) -> None:
        """Create collection if it doesn't exist. Idempotent."""

    @abstractmethod
    async def upsert(
        self,
        chunk_ids: list[str],
        vectors: list[list[float]],
        payloads: list[ChunkPayload],
    ) -> int:
        """Upsert chunks. Returns number written."""

    @abstractmethod
    async def search(
        self,
        query_vector: list[float],
        filter_: SearchFilter | None = None,
        top_k: int = 5,
    ) -> list[SearchResult]:
        """Vector search with optional metadata filter."""

    @abstractmethod
    async def get_by_id(self, chunk_id: str) -> ChunkPayload | None:
        """Fetch one chunk by ID."""

    @abstractmethod
    async def delete_by_filter(self, filter_: SearchFilter) -> int:
        """Delete matching chunks. Used for re-ingestion."""

    @abstractmethod
    async def count(self, filter_: SearchFilter | None = None) -> int:
        """How many chunks match the filter?"""


# ===========================================================================
# IN-MEMORY IMPLEMENTATION (for tests)
# ===========================================================================

class InMemoryVectorStore(VectorStore):
    """Pure-Python vector store. Maps chunk_id → (vector, payload)."""

    def __init__(self):
        self._data: dict[str, tuple[list[float], ChunkPayload]] = {}

    async def ensure_collection(self) -> None:
        return None

    async def upsert(
        self,
        chunk_ids: list[str],
        vectors: list[list[float]],
        payloads: list[ChunkPayload],
    ) -> int:
        assert len(chunk_ids) == len(vectors) == len(payloads)
        for cid, vec, pl in zip(chunk_ids, vectors, payloads):
            self._data[cid] = (vec, pl)
        return len(chunk_ids)

    async def search(
        self,
        query_vector: list[float],
        filter_: SearchFilter | None = None,
        top_k: int = 5,
    ) -> list[SearchResult]:
        candidates: list[tuple[ChunkPayload, float]] = []
        for cid, (vec, pl) in self._data.items():
            if filter_ and not filter_.matches(pl):
                continue
            sim = _cosine_similarity(query_vector, vec)
            candidates.append((pl, sim))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return [
            SearchResult(chunk=c, score=s) for c, s in candidates[:top_k]
        ]

    async def get_by_id(self, chunk_id: str) -> ChunkPayload | None:
        entry = self._data.get(chunk_id)
        return entry[1] if entry else None

    async def delete_by_filter(self, filter_: SearchFilter) -> int:
        to_delete = [
            cid for cid, (_, pl) in self._data.items() if filter_.matches(pl)
        ]
        for cid in to_delete:
            del self._data[cid]
        return len(to_delete)

    async def count(self, filter_: SearchFilter | None = None) -> int:
        if not filter_:
            return len(self._data)
        return sum(
            1 for _, (_, pl) in self._data.items() if filter_.matches(pl)
        )


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


# ===========================================================================
# QDRANT IMPLEMENTATION (production)
# ===========================================================================

class QdrantVectorStore(VectorStore):
    """Real Qdrant backend. Lazy-imports qdrant-client so tests without
    the package can still run."""

    def __init__(
        self,
        url: str = "http://localhost:6333",
        collection_name: str = "mira_chunks",
        vector_size: int = 1536,
    ):
        self.url = url
        self.collection_name = collection_name
        self.vector_size = vector_size
        self._client = None

    def _get_client(self):
        if self._client is None:
            from app.mira.retrieval.qdrant_client import AsyncQdrantClient  # lazy import
            self._client = AsyncQdrantClient(url=self.url)
        return self._client

    async def ensure_collection(self) -> None:
        from qdrant_client.http import models

        client = self._get_client()
        existing = await client.get_collections()
        names = [c.name for c in existing.collections]
        if self.collection_name in names:
            return
        await client.create_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(
                size=self.vector_size,
                distance=models.Distance.COSINE,
            ),
            quantization_config=models.ScalarQuantization(
                scalar=models.ScalarQuantizationConfig(
                    type=models.ScalarType.INT8,
                    always_ram=True,
                ),
            ),
        )

    async def upsert(
        self,
        chunk_ids: list[str],
        vectors: list[list[float]],
        payloads: list[ChunkPayload],
    ) -> int:
        from qdrant_client.http import models

        client = self._get_client()
        points = [
            models.PointStruct(
                id=_chunk_id_to_qdrant_id(cid),
                vector=vec,
                payload=pl.to_qdrant_payload(),
            )
            for cid, vec, pl in zip(chunk_ids, vectors, payloads)
        ]
        result = await client.upsert(
            collection_name=self.collection_name, points=points
        )
        return len(points)

    async def search(
        self,
        query_vector: list[float],
        filter_: SearchFilter | None = None,
        top_k: int = 5,
    ) -> list[SearchResult]:
        from qdrant_client.http import models

        client = self._get_client()
        qfilter = self._build_qdrant_filter(filter_) if filter_ else None
        hits = await client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter=qfilter,
            limit=top_k,
            with_payload=True,
        )
        return [
            SearchResult(
                chunk=ChunkPayload.from_qdrant_payload(h.payload),
                score=h.score,
            )
            for h in hits
        ]

    async def get_by_id(self, chunk_id: str) -> ChunkPayload | None:
        client = self._get_client()
        points = await client.retrieve(
            collection_name=self.collection_name,
            ids=[_chunk_id_to_qdrant_id(chunk_id)],
            with_payload=True,
        )
        if not points:
            return None
        return ChunkPayload.from_qdrant_payload(points[0].payload)

    async def delete_by_filter(self, filter_: SearchFilter) -> int:
        from qdrant_client.http import models

        client = self._get_client()
        qfilter = self._build_qdrant_filter(filter_)
        # Count first so we can report what we deleted
        count = await self.count(filter_)
        await client.delete(
            collection_name=self.collection_name,
            points_selector=models.FilterSelector(filter=qfilter),
        )
        return count

    async def count(self, filter_: SearchFilter | None = None) -> int:
        client = self._get_client()
        qfilter = self._build_qdrant_filter(filter_) if filter_ else None
        result = await client.count(
            collection_name=self.collection_name, count_filter=qfilter
        )
        return result.count

    def _build_qdrant_filter(self, f: SearchFilter):
        from qdrant_client.http import models

        conditions = []
        if f.course_id:
            conditions.append(
                models.FieldCondition(
                    key="course_id", match=models.MatchValue(value=f.course_id)
                )
            )
        if f.module_id:
            conditions.append(
                models.FieldCondition(
                    key="module_id", match=models.MatchValue(value=f.module_id)
                )
            )
        if f.section_id:
            conditions.append(
                models.FieldCondition(
                    key="section_id", match=models.MatchValue(value=f.section_id)
                )
            )
        if f.source_type:
            conditions.append(
                models.FieldCondition(
                    key="source_type",
                    match=models.MatchValue(value=f.source_type),
                )
            )
        return models.Filter(must=conditions) if conditions else None


def _chunk_id_to_qdrant_id(chunk_id: str) -> int:
    """Qdrant needs numeric IDs. Use a stable hash of chunk_id."""
    import hashlib
    h = hashlib.sha256(chunk_id.encode()).hexdigest()
    # Take first 15 hex chars → 60-bit integer (fits in Qdrant's int64)
    return int(h[:15], 16)
