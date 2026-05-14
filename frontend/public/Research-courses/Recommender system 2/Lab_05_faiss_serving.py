"""
Lab 05 · FAISS ANN Serving Benchmark
Marevlo Research — Recommender Systems Track

Covers: M28 (Serving at Scale — ANN Search)

Run: python Lab_05_faiss_serving.py

Requirements: numpy, faiss-cpu (pip install faiss-cpu)
Note: This lab uses synthetic embeddings if Lab 04 hasn't been run.
"""

import numpy as np
import time

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
    print("⚠️  faiss not installed. Install with: pip install faiss-cpu")
    print("    (or faiss-gpu for GPU acceleration)")
    exit(1)


# ═══════════════════════════════════════════════════════════════
# 1. GENERATE EMBEDDINGS
# ═══════════════════════════════════════════════════════════════

def generate_embeddings(n_items=480_000, n_users=10_000, k=128):
    """
    Generate synthetic embeddings simulating BPR-MF output.
    In production, these come from Lab 04's trained model.
    """
    print(f"Generating synthetic embeddings: {n_items} items, {n_users} users, k={k}")
    
    # Simulate clustered embeddings (items from same category are nearby)
    n_clusters = 50
    cluster_centers = np.random.randn(n_clusters, k).astype(np.float32)
    
    item_embeddings = np.zeros((n_items, k), dtype=np.float32)
    for i in range(n_items):
        cluster = i % n_clusters
        item_embeddings[i] = cluster_centers[cluster] + np.random.randn(k).astype(np.float32) * 0.3
    
    # Normalize to unit length (required for inner product → cosine via FAISS)
    norms = np.linalg.norm(item_embeddings, axis=1, keepdims=True)
    item_embeddings = item_embeddings / np.maximum(norms, 1e-8)
    
    user_embeddings = np.random.randn(n_users, k).astype(np.float32)
    user_norms = np.linalg.norm(user_embeddings, axis=1, keepdims=True)
    user_embeddings = user_embeddings / np.maximum(user_norms, 1e-8)
    
    return item_embeddings, user_embeddings


# ═══════════════════════════════════════════════════════════════
# 2. BRUTE FORCE BASELINE (Module 28 S1)
# ═══════════════════════════════════════════════════════════════

def brute_force_search(user_emb, item_embeddings, k=500):
    """Exact nearest neighbors via full dot product."""
    scores = item_embeddings @ user_emb
    top_k = np.argpartition(scores, -k)[-k:]
    top_k = top_k[np.argsort(scores[top_k])[::-1]]
    return top_k, scores[top_k]


# ═══════════════════════════════════════════════════════════════
# 3. FAISS INDEX CONSTRUCTION (Module 28 S2)
# ═══════════════════════════════════════════════════════════════

def build_flat_index(item_embeddings):
    """Exact index — brute force via FAISS (baseline)."""
    k = item_embeddings.shape[1]
    index = faiss.IndexFlatIP(k)  # Inner Product (cosine on normalized vectors)
    index.add(item_embeddings)
    return index


def build_ivf_pq_index(item_embeddings, nlist=1024, m=32, nbits=8):
    """
    IVF-PQ index from Module 28:
    - IVF: partition items into nlist clusters, search only nearby clusters
    - PQ: compress each vector from k*4 bytes to m bytes
    
    Together: ~100× faster than brute force at 95%+ recall.
    """
    k = item_embeddings.shape[1]
    n_items = item_embeddings.shape[0]
    
    # Quantizer: used to assign items to clusters
    quantizer = faiss.IndexFlatIP(k)
    
    # IVF-PQ index
    index = faiss.IndexIVFPQ(quantizer, k, nlist, m, nbits)
    
    # Train the index (learns cluster centers + PQ codebook)
    print(f"  Training IVF-PQ index (nlist={nlist}, m={m})...")
    t0 = time.time()
    index.train(item_embeddings)
    train_time = time.time() - t0
    print(f"  Training time: {train_time:.1f}s")
    
    # Add all items
    index.add(item_embeddings)
    print(f"  Index size: {n_items} vectors")
    
    return index


def build_hnsw_index(item_embeddings, M=32, ef_construction=200):
    """
    HNSW index from Module 28:
    Hierarchical graph — multi-layer navigation.
    Excellent recall, fast search, but uses more memory than IVF-PQ.
    """
    k = item_embeddings.shape[1]
    index = faiss.IndexHNSWFlat(k, M)
    index.hnsw.efConstruction = ef_construction
    
    print(f"  Building HNSW index (M={M}, efConstruction={ef_construction})...")
    t0 = time.time()
    index.add(item_embeddings)
    build_time = time.time() - t0
    print(f"  Build time: {build_time:.1f}s")
    
    return index


# ═══════════════════════════════════════════════════════════════
# 4. BENCHMARKING
# ═══════════════════════════════════════════════════════════════

def benchmark_latency(index, user_embeddings, k=500, n_queries=1000, nprobe=None):
    """Measure P50 and P99 query latency."""
    if nprobe is not None and hasattr(index, 'nprobe'):
        index.nprobe = nprobe
    
    latencies = []
    for i in range(min(n_queries, len(user_embeddings))):
        query = user_embeddings[i:i+1]
        t0 = time.perf_counter()
        distances, indices = index.search(query, k)
        t1 = time.perf_counter()
        latencies.append((t1 - t0) * 1000)  # ms
    
    latencies = np.array(latencies)
    return {
        "P50_ms": np.percentile(latencies, 50),
        "P99_ms": np.percentile(latencies, 99),
        "mean_ms": np.mean(latencies),
    }


def benchmark_recall(index, item_embeddings, user_embeddings, k=500, 
                     n_queries=100, nprobe=None):
    """Compare ANN results to brute force (ground truth)."""
    if nprobe is not None and hasattr(index, 'nprobe'):
        index.nprobe = nprobe
    
    recalls = []
    for i in range(min(n_queries, len(user_embeddings))):
        query = user_embeddings[i]
        
        # Ground truth (brute force)
        gt_indices, _ = brute_force_search(query, item_embeddings, k)
        gt_set = set(gt_indices)
        
        # ANN result
        distances, ann_indices = index.search(user_embeddings[i:i+1], k)
        ann_set = set(ann_indices[0])
        
        recall = len(gt_set & ann_set) / len(gt_set)
        recalls.append(recall)
    
    return np.mean(recalls)


# ═══════════════════════════════════════════════════════════════
# 5. MAIN
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("  Lab 05 · FAISS ANN Serving Benchmark")
    print("  Marevlo Research — Recommender Systems Track")
    print("=" * 60)
    
    # Use smaller scale for quick demo (scale up for production test)
    N_ITEMS = 100_000  # Change to 480_000 for Kartify-scale
    N_USERS = 1_000
    K_DIM = 128
    
    item_emb, user_emb = generate_embeddings(N_ITEMS, N_USERS, K_DIM)
    
    # ─── Brute Force Baseline ───
    print(f"\n{'─' * 50}")
    print("1. Brute Force (exact)")
    flat_index = build_flat_index(item_emb)
    bf_latency = benchmark_latency(flat_index, user_emb, k=500, n_queries=200)
    print(f"   P50: {bf_latency['P50_ms']:.2f}ms  P99: {bf_latency['P99_ms']:.2f}ms")
    
    # ─── IVF-PQ ───
    print(f"\n{'─' * 50}")
    print("2. IVF-PQ (approximate)")
    ivf_index = build_ivf_pq_index(item_emb, nlist=256, m=32)
    
    for nprobe in [4, 8, 16, 32]:
        lat = benchmark_latency(ivf_index, user_emb, k=500, n_queries=200, nprobe=nprobe)
        rec = benchmark_recall(ivf_index, item_emb, user_emb, k=500, n_queries=50, nprobe=nprobe)
        target_lat = "✅" if lat["P99_ms"] < 10 else "❌"
        target_rec = "✅" if rec > 0.95 else "⚠️" if rec > 0.90 else "❌"
        print(f"   nprobe={nprobe:>2d}: P50={lat['P50_ms']:.2f}ms P99={lat['P99_ms']:.2f}ms {target_lat} | "
              f"Recall@500={rec:.3f} {target_rec}")
    
    # ─── HNSW ───
    print(f"\n{'─' * 50}")
    print("3. HNSW (approximate)")
    hnsw_index = build_hnsw_index(item_emb, M=32)
    hnsw_lat = benchmark_latency(hnsw_index, user_emb, k=500, n_queries=200)
    hnsw_rec = benchmark_recall(hnsw_index, item_emb, user_emb, k=500, n_queries=50)
    print(f"   P50: {hnsw_lat['P50_ms']:.2f}ms  P99: {hnsw_lat['P99_ms']:.2f}ms | "
          f"Recall@500={hnsw_rec:.3f}")
    
    # ─── Summary ───
    print(f"\n{'=' * 60}")
    print("  SERVING BENCHMARK SUMMARY")
    print(f"{'=' * 60}")
    print(f"  {'Method':<20} {'P99 (ms)':>10} {'Recall@500':>12} {'Target':>8}")
    print(f"  {'─' * 52}")
    print(f"  {'Brute Force':<20} {bf_latency['P99_ms']:>10.2f} {'1.000':>12} {'—':>8}")
    
    best_ivf = benchmark_latency(ivf_index, user_emb, k=500, n_queries=200, nprobe=16)
    best_ivf_rec = benchmark_recall(ivf_index, item_emb, user_emb, k=500, n_queries=50, nprobe=16)
    print(f"  {'IVF-PQ (nprobe=16)':<20} {best_ivf['P99_ms']:>10.2f} {best_ivf_rec:>12.3f} {'<10ms':>8}")
    print(f"  {'HNSW (M=32)':<20} {hnsw_lat['P99_ms']:>10.2f} {hnsw_rec:>12.3f} {'<10ms':>8}")
    
    speedup = bf_latency['P99_ms'] / best_ivf['P99_ms'] if best_ivf['P99_ms'] > 0 else 0
    print(f"\n  IVF-PQ speedup over brute force: {speedup:.0f}×")
    print(f"  Items indexed: {N_ITEMS:,}")
    
    print(f"\n✅ Lab 05 complete.")
    print(f"   Retrieval serving is production-ready if P99 < 10ms and Recall > 95%")
    print(f"   Next: Lab 06 (Full capstone pipeline)")
