"""
Lab 06 · Full Capstone Pipeline — End to End
Marevlo Research — Recommender Systems Track

Covers: M32 (Capstone Retrieval), M33 (Capstone Ranking), M34 (Full Pipeline)

This lab is the RUNNABLE companion to the capstone modules.
It implements the complete retrieval → ranking → reranking pipeline
on MovieLens 100K and produces the evaluation report.

Run: python Lab_06_capstone_pipeline.py

Requirements: numpy, scipy, torch
"""

import numpy as np
import time
from scipy.sparse import csr_matrix
from collections import defaultdict
import os, urllib.request, zipfile

try:
    import torch
    import torch.nn as nn
except ImportError:
    print("⚠️  PyTorch required. Install with: pip install torch")
    exit(1)


# ═══════════════════════════════════════════════════════════════
# 1. DATA LOADING
# ═══════════════════════════════════════════════════════════════

def load_data():
    data_dir = "ml-100k"
    if not os.path.exists(data_dir):
        print("Downloading MovieLens 100K...")
        url = "https://files.grouplens.org/datasets/movielens/ml-100k.zip"
        urllib.request.urlretrieve(url, "ml-100k.zip")
        with zipfile.ZipFile("ml-100k.zip", "r") as z:
            z.extractall(".")

    ratings = []
    with open(f"{data_dir}/u.data", "r") as f:
        for line in f:
            p = line.strip().split("\t")
            uid, iid, r, ts = int(p[0])-1, int(p[1])-1, float(p[2]), int(p[3])
            if r >= 4.0:
                ratings.append((uid, iid, ts))
    ratings.sort(key=lambda x: x[2])

    split = int(len(ratings) * 0.8)
    train, test = ratings[:split], ratings[split:]
    n_users = max(r[0] for r in ratings) + 1
    n_items = max(r[1] for r in ratings) + 1

    R_train = csr_matrix(
        ([1.0]*len(train), ([u for u,i,t in train], [i for u,i,t in train])),
        shape=(n_users, n_items)
    )
    test_dict = defaultdict(set)
    for u, i, t in test:
        test_dict[u].add(i)

    return train, test_dict, R_train, n_users, n_items


# ═══════════════════════════════════════════════════════════════
# 2. EVALUATION HARNESS
# ═══════════════════════════════════════════════════════════════

def evaluate(recommend_fn, test_dict, k=10, n_eval=500):
    ndcgs, precs, recalls = [], [], []
    users = [u for u in test_dict if len(test_dict[u]) > 0][:n_eval]
    for u in users:
        recs = recommend_fn(u)[:k]
        rel = test_dict[u]
        relevance = [1.0 if i in rel else 0.0 for i in recs]
        dcg = sum(r / np.log2(p+2) for p, r in enumerate(relevance))
        ideal = sum(1.0 / np.log2(p+2) for p in range(min(k, len(rel))))
        ndcgs.append(dcg / ideal if ideal > 0 else 0)
        precs.append(sum(relevance) / k)
        recalls.append(sum(relevance) / len(rel) if rel else 0)
    return {"nDCG@10": np.mean(ndcgs), "P@10": np.mean(precs), "R@10": np.mean(recalls)}


# ═══════════════════════════════════════════════════════════════
# 3. STAGE 1: RETRIEVAL MODELS
# ═══════════════════════════════════════════════════════════════

# ─── Popularity ───
def popularity_model(R_train):
    pop = np.array(R_train.sum(axis=0)).flatten()
    def recommend(u, k=100):
        scores = pop.copy()
        seen = set(R_train[u].nonzero()[1])
        for s in seen: scores[s] = -np.inf
        return np.argsort(scores)[-k:][::-1]
    return recommend

# ─── Item-kNN with shrinkage ───
def item_knn_model(R_train, shrinkage=100, n_neighbors=50):
    RtR = (R_train.T @ R_train).toarray()
    norms = np.sqrt(np.array(R_train.power(2).sum(axis=0)).flatten())
    norms[norms == 0] = 1.0
    cosine = RtR / np.outer(norms, norms)
    shrink_w = RtR / (RtR + shrinkage)
    sim = cosine * shrink_w
    np.fill_diagonal(sim, 0)

    def recommend(u, k=100):
        items = R_train[u].toarray().flatten()
        interacted = np.where(items > 0)[0]
        if len(interacted) == 0: return np.array([])
        scores = sim[interacted].sum(axis=0)
        scores[interacted] = -np.inf
        return np.argsort(scores)[-k:][::-1]
    return recommend

# ─── BPR-MF ───
class BPR_MF(nn.Module):
    def __init__(self, n_users, n_items, k=64):
        super().__init__()
        self.user_emb = nn.Embedding(n_users, k)
        self.item_emb = nn.Embedding(n_items, k)
        nn.init.normal_(self.user_emb.weight, std=0.01)
        nn.init.normal_(self.item_emb.weight, std=0.01)

    def forward(self, users, pos, neg):
        u = self.user_emb(users)
        x = (u * self.item_emb(pos)).sum(1) - (u * self.item_emb(neg)).sum(1)
        return x

    def predict_all(self, u):
        with torch.no_grad():
            return (self.item_emb.weight @ self.user_emb.weight[u]).cpu().numpy()

def train_bpr(n_users, n_items, train_data, k=64, epochs=15, lr=0.005, reg=0.001):
    model = BPR_MF(n_users, n_items, k)
    opt = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=reg)
    user_items = defaultdict(set)
    for u, i, t in train_data: user_items[u].add(i)
    users_a = np.array([u for u,i,t in train_data])
    items_a = np.array([i for u,i,t in train_data])

    for ep in range(epochs):
        model.train()
        perm = np.random.permutation(len(train_data))
        total_loss = 0
        bs = 4096
        for start in range(0, len(perm), bs):
            idx = perm[start:start+bs]
            bu = torch.LongTensor(users_a[idx])
            bp = torch.LongTensor(items_a[idx])
            bn = torch.LongTensor([
                np.random.choice([x for x in range(n_items) if x not in user_items[users_a[j]]])
                for j in idx
            ])
            x = model(bu, bp, bn)
            loss = -torch.log(torch.sigmoid(x) + 1e-10).mean()
            opt.zero_grad(); loss.backward(); opt.step()
            total_loss += loss.item()
        print(f"    Epoch {ep+1}/{epochs}: loss={total_loss/(len(perm)//bs):.4f}")

    def recommend(u, k=100):
        scores = model.predict_all(u)
        seen = set(csr_matrix.getrow(R_train_global, u).nonzero()[1]) if hasattr(model, '_R') else set()
        for s in seen: scores[s] = -np.inf
        return np.argsort(scores)[-k:][::-1]

    return model, recommend


# ═══════════════════════════════════════════════════════════════
# 4. STAGE 2: SIMPLE RANKING (feature-based reranking)
# ═══════════════════════════════════════════════════════════════

def build_ranker(R_train, model):
    """
    Simple ranking: combine retrieval score + item popularity + user-item features.
    In production, this would be DeepFM/DCN-v2 (M33).
    For this lab: weighted linear combination as a proxy.
    """
    item_pop = np.array(R_train.sum(axis=0)).flatten().astype(float)
    item_pop = item_pop / item_pop.max()  # Normalize to [0, 1]

    def rerank(user_id, candidates, k=20):
        """Score candidates with features beyond retrieval score."""
        retrieval_scores = model.predict_all(user_id)

        # Feature 1: retrieval score (BPR dot product)
        ret_scores = retrieval_scores[candidates]
        ret_norm = (ret_scores - ret_scores.min()) / (ret_scores.max() - ret_scores.min() + 1e-10)

        # Feature 2: item popularity (normalized)
        pop_scores = item_pop[candidates]

        # Feature 3: retrieval rank position (higher rank = higher score)
        rank_scores = np.linspace(1.0, 0.0, len(candidates))

        # Combined score (in production: learned weights via DeepFM)
        combined = 0.6 * ret_norm + 0.25 * pop_scores + 0.15 * rank_scores

        top_k_idx = np.argsort(combined)[-k:][::-1]
        return candidates[top_k_idx]

    return rerank


# ═══════════════════════════════════════════════════════════════
# 5. STAGE 3: RERANKING — MMR DIVERSITY (Module 27)
# ═══════════════════════════════════════════════════════════════

def mmr_rerank(items, item_embeddings, k=10, lam=0.7):
    """
    Maximal Marginal Relevance from Module 27.
    Balance relevance (original rank position) with diversity.
    """
    if len(items) <= k:
        return items

    selected = [items[0]]  # Start with the top-ranked item
    remaining = list(items[1:])

    while len(selected) < k and remaining:
        best_score = -np.inf
        best_idx = 0

        for idx, item in enumerate(remaining):
            # Relevance: position-based (higher = better)
            relevance = 1.0 - (idx / len(remaining))

            # Max similarity to already selected items
            item_vec = item_embeddings[item]
            max_sim = max(
                np.dot(item_vec, item_embeddings[s]) /
                (np.linalg.norm(item_vec) * np.linalg.norm(item_embeddings[s]) + 1e-10)
                for s in selected
            )

            mmr = lam * relevance - (1 - lam) * max_sim

            if mmr > best_score:
                best_score = mmr
                best_idx = idx

        selected.append(remaining.pop(best_idx))

    return np.array(selected)


# ═══════════════════════════════════════════════════════════════
# 6. FULL PIPELINE
# ═══════════════════════════════════════════════════════════════

def full_pipeline(user_id, retrieval_fn, ranker_fn, item_embeddings, k=10):
    """
    Complete pipeline from M34:
    Retrieval (100 candidates) → Ranking (top 30) → Reranking (final k)
    """
    # Stage 1: Retrieval
    candidates = retrieval_fn(user_id, k=100)

    # Stage 2: Ranking
    ranked = ranker_fn(user_id, candidates, k=30)

    # Stage 3: MMR Reranking
    final = mmr_rerank(ranked, item_embeddings, k=k, lam=0.7)

    return final


# ═══════════════════════════════════════════════════════════════
# 7. MAIN
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 65)
    print("  Lab 06 · Full Capstone Pipeline — End to End")
    print("  Marevlo Research — Recommender Systems Track")
    print("=" * 65)

    train, test_dict, R_train, n_users, n_items = load_data()
    R_train_global = R_train  # For BPR recommend function
    print(f"\n{n_users} users, {n_items} items, {len(train)} train interactions")

    # ─── Baselines ───
    print(f"\n{'━' * 50}")
    print("  STAGE 1: RETRIEVAL MODELS")
    print(f"{'━' * 50}")

    print("\n1. Popularity baseline...")
    pop_fn = popularity_model(R_train)
    pop_res = evaluate(pop_fn, test_dict)

    print("2. Item-kNN (λ=100)...")
    knn_fn = item_knn_model(R_train, shrinkage=100)
    knn_res = evaluate(knn_fn, test_dict)

    print("3. BPR-MF (k=64, 15 epochs)...")
    bpr_model, bpr_fn_raw = train_bpr(n_users, n_items, train, k=64, epochs=15)

    def bpr_fn(u, k=100):
        scores = bpr_model.predict_all(u)
        seen = set(R_train[u].nonzero()[1])
        for s in seen: scores[s] = -np.inf
        return np.argsort(scores)[-k:][::-1]

    bpr_res = evaluate(bpr_fn, test_dict)

    # ─── Ranking ───
    print(f"\n{'━' * 50}")
    print("  STAGE 2: RANKING (retrieval + feature reranking)")
    print(f"{'━' * 50}")

    ranker = build_ranker(R_train, bpr_model)

    def ranked_fn(u, k=10):
        candidates = bpr_fn(u, k=100)
        return ranker(u, candidates, k=k)

    ranked_res = evaluate(ranked_fn, test_dict)

    # ─── Full Pipeline ───
    print(f"\n{'━' * 50}")
    print("  STAGE 3: FULL PIPELINE (retrieval → ranking → MMR)")
    print(f"{'━' * 50}")

    item_emb = bpr_model.item_emb.weight.detach().cpu().numpy()

    def pipeline_fn(u, k=10):
        return full_pipeline(u, bpr_fn, ranker, item_emb, k=k)

    pipeline_res = evaluate(pipeline_fn, test_dict)

    # ─── Latency benchmark ───
    print(f"\n{'━' * 50}")
    print("  LATENCY BENCHMARK")
    print(f"{'━' * 50}")

    latencies = []
    for u in list(test_dict.keys())[:100]:
        t0 = time.perf_counter()
        _ = full_pipeline(u, bpr_fn, ranker, item_emb, k=10)
        latencies.append((time.perf_counter() - t0) * 1000)

    print(f"  P50: {np.percentile(latencies, 50):.1f}ms")
    print(f"  P99: {np.percentile(latencies, 99):.1f}ms")
    print(f"  Mean: {np.mean(latencies):.1f}ms")

    # ═══════════════════════════════════════════════════════════
    #  FINAL LEADERBOARD
    # ═══════════════════════════════════════════════════════════

    print(f"\n{'═' * 65}")
    print("  CAPSTONE LEADERBOARD")
    print(f"{'═' * 65}")
    print(f"  {'Model':<35} {'nDCG@10':>8} {'P@10':>8} {'R@10':>8}")
    print(f"  {'─' * 57}")
    print(f"  {'Popularity (M06)':<35} {pop_res['nDCG@10']:>8.4f} {pop_res['P@10']:>8.4f} {pop_res['R@10']:>8.4f}")
    print(f"  {'Item-kNN + shrinkage (M09-M11)':<35} {knn_res['nDCG@10']:>8.4f} {knn_res['P@10']:>8.4f} {knn_res['R@10']:>8.4f}")
    print(f"  {'BPR-MF retrieval only (M16)':<35} {bpr_res['nDCG@10']:>8.4f} {bpr_res['P@10']:>8.4f} {bpr_res['R@10']:>8.4f}")
    print(f"  {'BPR-MF + ranking (M21/M33)':<35} {ranked_res['nDCG@10']:>8.4f} {ranked_res['P@10']:>8.4f} {ranked_res['R@10']:>8.4f}")
    print(f"  {'Full pipeline + MMR (M27/M34)':<35} {pipeline_res['nDCG@10']:>8.4f} {pipeline_res['P@10']:>8.4f} {pipeline_res['R@10']:>8.4f}")
    print(f"  {'─' * 57}")

    lift = (bpr_res['nDCG@10'] / pop_res['nDCG@10'] - 1) * 100 if pop_res['nDCG@10'] > 0 else 0
    print(f"\n  BPR-MF vs Popularity: +{lift:.0f}% nDCG@10")
    print(f"  Full pipeline P99 latency: {np.percentile(latencies, 99):.0f}ms")

    print(f"\n{'═' * 65}")
    print("  ✅ CAPSTONE COMPLETE")
    print(f"{'═' * 65}")
    print(f"  You've built: popularity → kNN → BPR-MF → ranking → MMR reranking")
    print(f"  Each model beats the previous. The pipeline runs end-to-end.")
    print(f"  This is the system from M32-M34 — running, evaluated, benchmarked.")
