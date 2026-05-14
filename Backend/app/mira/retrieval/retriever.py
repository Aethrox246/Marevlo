"""RAG retriever — orchestrates embedding + vector search.

Given (question, course, module), produces:
  - Top-K relevant chunks (for prompt context)
  - Matched concepts (for belief updates)
  - Hit quality metadata (for observability)

Also handles the embedding step with two backends:
  - OpenAIEmbedder: real text-embedding-3-small (for production)
  - FakeEmbedder: deterministic hash-based vectors (for tests)

Either can be injected — tests use the fake, prod uses OpenAI.
"""
from __future__ import annotations

import hashlib
from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.mira.cognitive.concept_matcher import ConceptMatch, ConceptMatcher
from app.mira.models.schemas import ConceptLattice
from app.mira.retrieval.qdrant_client import (
    ChunkPayload,
    SearchFilter,
    SearchResult,
    VectorStore,
)


# ===========================================================================
# EMBEDDING INTERFACES
# ===========================================================================

class Embedder(ABC):
    """Abstract embedder. Returns list[float] of fixed size."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        ...

    @abstractmethod
    async def embed_one(self, text: str) -> list[float]:
        ...

    @abstractmethod
    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        ...


class OpenAIEmbedder(Embedder):
    """Real OpenAI text-embedding-3-small (1536 dims)."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    @property
    def dimension(self) -> int:
        return 1536

    def _get_client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=self.api_key)
        return self._client

    async def embed_one(self, text: str) -> list[float]:
        client = self._get_client()
        resp = await client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return resp.data[0].embedding

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        client = self._get_client()
        resp = await client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        return [d.embedding for d in resp.data]


class FakeEmbedder(Embedder):
    """Deterministic hash-based embedder for tests.

    Property: same text always produces the same vector, and different texts
    produce different vectors. Not semantically meaningful, but stable and
    fast. Importantly, similar strings produce SOMEWHAT similar vectors
    because we use n-gram hashing.
    """

    def __init__(self, dimension: int = 128):
        self._dimension = dimension

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed_one(self, text: str) -> list[float]:
        return self._hash_embed(text)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [self._hash_embed(t) for t in texts]

    def _hash_embed(self, text: str) -> list[float]:
        """Bag-of-character-trigrams hashing. Similar strings → similar vectors."""
        vec = [0.0] * self._dimension
        text_norm = text.lower()
        # Character trigrams
        for i in range(len(text_norm) - 2):
            trigram = text_norm[i : i + 3]
            h = int(
                hashlib.sha256(trigram.encode()).hexdigest()[:10], 16
            )
            idx = h % self._dimension
            sign = 1.0 if (h // self._dimension) % 2 else -1.0
            vec[idx] += sign
        # L2 normalize
        norm = sum(x * x for x in vec) ** 0.5
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec


# ===========================================================================
# RETRIEVAL RESULT
# ===========================================================================

@dataclass
class RetrievalResult:
    chunks: list[ChunkPayload]
    matched_concepts: list[ConceptMatch]
    scores: list[float]             # parallel to chunks
    filter_was_restrictive: bool    # True if course/module filter was applied
    fallback_triggered: bool        # True if zero matches in scope, widened


# ===========================================================================
# RETRIEVER
# ===========================================================================

class Retriever:
    """Orchestrates concept matching + vector search.

    Flow:
      1. Match question against concept lattice → matched concepts
      2. Embed question
      3. Vector search with metadata filter (course_id, module_id)
      4. If zero hits, widen filter (drop module_id, then source_type)
      5. Return top-K with metadata
    """

    def __init__(
        self,
        vector_store: VectorStore,
        embedder: Embedder,
    ):
        self.vector_store = vector_store
        self.embedder = embedder

    async def retrieve(
        self,
        question: str,
        lattice: ConceptLattice | None = None,
        course_id: str | None = None,
        module_id: str | None = None,
        top_k: int = 5,
    ) -> RetrievalResult:
        # 1. Concept matching (if we have a lattice)
        matched_concepts: list[ConceptMatch] = []
        if lattice:
            matched_concepts = ConceptMatcher.match(
                question, lattice, top_k=3
            )

        # 2. Embed
        query_vec = await self.embedder.embed_one(question)

        # 3. Scoped search
        scoped_filter = SearchFilter(
            course_id=course_id,
            module_id=module_id,
        )
        scoped_hits = await self.vector_store.search(
            query_vec, scoped_filter, top_k=top_k
        )

        # 4. Fallback: widen if zero hits
        fallback_triggered = False
        hits = scoped_hits
        if not hits and module_id is not None:
            # Drop module filter
            fallback_triggered = True
            widened = SearchFilter(course_id=course_id)
            hits = await self.vector_store.search(
                query_vec, widened, top_k=top_k
            )
        if not hits and course_id is not None:
            # Drop course filter too
            fallback_triggered = True
            hits = await self.vector_store.search(
                query_vec, None, top_k=top_k
            )

        return RetrievalResult(
            chunks=[h.chunk for h in hits],
            matched_concepts=matched_concepts,
            scores=[h.score for h in hits],
            filter_was_restrictive=(course_id is not None),
            fallback_triggered=fallback_triggered,
        )

    def format_chunks_for_prompt(
        self,
        chunks: list[ChunkPayload],
        max_chars: int = 6000,
    ) -> str:
        """Format retrieved chunks into a prompt-ready string.

        Truncates to max_chars, preserving whole chunks. Each chunk gets
        a header showing its heading trail so Claude knows the context.
        """
        out: list[str] = []
        total = 0
        for i, ch in enumerate(chunks):
            heading = " > ".join(ch.heading_trail) if ch.heading_trail else ""
            block = (
                f"[Source {i+1}: {heading}]\n{ch.text}\n"
                if heading
                else f"[Source {i+1}]\n{ch.text}\n"
            )
            if total + len(block) > max_chars:
                break
            out.append(block)
            total += len(block)
        return "\n".join(out)
