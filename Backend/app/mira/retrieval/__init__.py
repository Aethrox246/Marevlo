"""MIRA retrieval layer.

Three modules:
  - qdrant_client.py: Qdrant wrapper + in-memory fake for testing
  - lattice.py: Concept lattice loader, prerequisite DFS
  - retriever.py: RAG orchestrator combining lattice + vector search
"""
from app.mira.retrieval.qdrant_client import (
    ChunkPayload,
    VectorStore,
    QdrantVectorStore,
    InMemoryVectorStore,
)
from app.mira.retrieval.lattice import LatticeLoader, LatticeService
from app.mira.retrieval.retriever import Retriever, RetrievalResult

__all__ = [
    "ChunkPayload",
    "VectorStore",
    "QdrantVectorStore",
    "InMemoryVectorStore",
    "LatticeLoader",
    "LatticeService",
    "Retriever",
    "RetrievalResult",
]
