"""
Lab 03 · Item-kNN with Shrinkage
Marevlo Research — Recommender Systems Track

Covers: M09 (Item-kNN), M10 (Similarity Metrics), M11 (Shrinkage)

Run: python Lab_03_item_knn_shrinkage.py

Requirements: numpy, scipy, pandas
Dataset: MovieLens 100K (auto-downloaded if missing)
"""

import numpy as np
import os, urllib.request, zipfile
from scipy.sparse import csr_matrix
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════
# 1. DATA LOADING — MovieLens 100K
# ═══════════════════════════════════════════════════════════════

def load_movielens_100k(min_rating=4.0):
    """Download and load MovieLens 100K as implicit interactions."""
    data_dir = "ml-100k"
    if not os.path.exists(data_dir):
        print("Downloading MovieLens 100K...")
        url = "https://files.grouplens.org/datasets/movielens/ml-100k.zip"
        urllib.request.urlretrieve(url, "ml-100k.zip")
        with zipfile.ZipFile("ml-100k.zip", "r") as z:
            z.extractall(".")
        print("Downloaded.")

    ratings = []
    with open(f"{data_dir}/u.data", "r") as f:
        for line in f:
            parts = line.strip().split("\t")
            uid, iid, rating, ts = int(parts[0]), int(parts[1]), float(parts[2]), int(parts[3])
            if rating >= min_rating:  # Implicit: treat rating >= 4 as positive
                ratings.append((uid, iid, ts))

    ratings.sort(key=lambda x: x[2])  # Sort by timestamp
    print(f"Loaded {len(ratings)} positive interactions (rating >= {min_rating})")
    return ratings


def temporal_split(ratings, test_fraction=0.2):
    """Last 20% of interactions by time → test set."""
    split_idx = int(len(ratings) * (1 - test_fraction))
    train = ratings[:split_idx]
    test = ratings[split_idx:]
    return train, test


def build_matrix(interactions, n_users, n_items):
    """Build sparse user-item interaction matrix."""
    rows = [u - 1 for u, i, t in interactions]
    cols = [i - 1 for u, i, t in interactions]
    vals = [1.0] * len(interactions)
    return csr_matrix((vals, (rows, cols)), shape=(n_users, n_items))


# ═══════════════════════════════════════════════════════════════
# 2. ITEM-KNN WITH SHRINKAGE (Module 09 + 11)
# ═══════════════════════════════════════════════════════════════

def compute_item_similarity(R, shrinkage=100, k_neighbors=50):
    """
    Compute item-item cosine similarity with shrinkage.
    
    Module 09: sim(i,j) = cos(r_i, r_j) = (r_i · r_j) / (||r_i|| * ||r_j||)
    Module 11: sim_shrunk(i,j) = (n_ij / (n_ij + λ)) * cos(i,j)
    
    Where n_ij = number of users who interacted with BOTH items i and j.
    """
    n_items = R.shape[1]
    
    # Item norms for cosine denominator
    item_norms = np.sqrt(np.array(R.power(2).sum(axis=0)).flatten())
    item_norms[item_norms == 0] = 1.0  # Avoid division by zero
    
    # Compute co-interaction matrix: R^T @ R gives co-interaction counts
    # (R^T @ R)[i,j] = number of users who interacted with both i and j
    RtR = (R.T @ R).toarray()
    
    # Co-interaction counts
    co_counts = RtR.copy()
    
    # Cosine similarity
    norms_outer = np.outer(item_norms, item_norms)
    cosine_sim = RtR / norms_outer
    
    # Apply shrinkage (Module 11)
    shrinkage_weight = co_counts / (co_counts + shrinkage)
    similarity = cosine_sim * shrinkage_weight
    
    # Zero out self-similarity
    np.fill_diagonal(similarity, 0.0)
    
    # Keep only top-k neighbors per item (sparsify for efficiency)
    for i in range(n_items):
        row = similarity[i]
        if np.count_nonzero(row) > k_neighbors:
            threshold = np.partition(row, -k_neighbors)[-k_neighbors]
            row[row < threshold] = 0.0
    
    print(f"Item similarity matrix: {n_items}×{n_items}, shrinkage λ={shrinkage}")
    print(f"  Non-zero entries: {np.count_nonzero(similarity):,}")
    print(f"  Density: {np.count_nonzero(similarity) / (n_items * n_items) * 100:.2f}%")
    
    return similarity


def item_knn_recommend(user_idx, R_train, similarity, k=10, exclude_seen=True):
    """
    Recommend items for a user using item-kNN.
    
    Score(u, i) = sum over items j in user's history: sim(i, j)
    """
    user_items = R_train[user_idx].toarray().flatten()
    interacted = np.where(user_items > 0)[0]
    
    if len(interacted) == 0:
        return []
    
    # Score all items: sum of similarities to user's interacted items
    scores = similarity[interacted].sum(axis=0)
    
    # Exclude already-seen items
    if exclude_seen:
        scores[interacted] = -np.inf
    
    # Return top-k item indices
    top_k = np.argsort(scores)[-k:][::-1]
    return top_k


# ═══════════════════════════════════════════════════════════════
# 3. POPULARITY BASELINE
# ═══════════════════════════════════════════════════════════════

def popularity_recommend(R_train, k=10, exclude_items=None):
    """Recommend most popular items (Module 06)."""
    pop = np.array(R_train.sum(axis=0)).flatten()
    if exclude_items is not None:
        pop[exclude_items] = -np.inf
    return np.argsort(pop)[-k:][::-1]


# ═══════════════════════════════════════════════════════════════
# 4. EVALUATION (Module 05 / Lab 01 harness)
# ═══════════════════════════════════════════════════════════════

def dcg_at_k(relevance, k):
    relevance = np.array(relevance[:k])
    positions = np.arange(1, len(relevance) + 1)
    return np.sum(relevance / np.log2(positions + 1))


def ndcg_at_k(recommended, relevant_set, k):
    relevance = [1.0 if item in relevant_set else 0.0 for item in recommended[:k]]
    dcg = dcg_at_k(relevance, k)
    ideal = dcg_at_k(sorted(relevance, reverse=True), k)
    return dcg / ideal if ideal > 0 else 0.0


def precision_at_k(recommended, relevant_set, k):
    hits = sum(1 for item in recommended[:k] if item in relevant_set)
    return hits / k


def recall_at_k(recommended, relevant_set, k):
    if len(relevant_set) == 0:
        return 0.0
    hits = sum(1 for item in recommended[:k] if item in relevant_set)
    return hits / len(relevant_set)


def evaluate_model(recommend_fn, R_train, test_dict, k=10, n_eval=500):
    """Evaluate a recommender on the test set."""
    ndcgs, precs, recalls = [], [], []
    
    eval_users = [u for u in test_dict if len(test_dict[u]) > 0]
    eval_users = eval_users[:n_eval]
    
    for user_idx in eval_users:
        relevant = test_dict[user_idx]
        recommended = recommend_fn(user_idx)
        
        ndcgs.append(ndcg_at_k(recommended, relevant, k))
        precs.append(precision_at_k(recommended, relevant, k))
        recalls.append(recall_at_k(recommended, relevant, k))
    
    return {
        "nDCG@10": np.mean(ndcgs),
        "P@10": np.mean(precs),
        "R@10": np.mean(recalls),
        "n_users": len(eval_users),
    }


# ═══════════════════════════════════════════════════════════════
# 5. MAIN — RUN EVERYTHING
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("  Lab 03 · Item-kNN with Shrinkage")
    print("  Marevlo Research — Recommender Systems Track")
    print("=" * 60)
    
    # Load data
    ratings = load_movielens_100k(min_rating=4.0)
    train, test = temporal_split(ratings)
    
    n_users = max(r[0] for r in ratings)
    n_items = max(r[1] for r in ratings)
    
    R_train = build_matrix(train, n_users, n_items)
    
    # Build test dictionary: user → set of relevant items
    test_dict = defaultdict(set)
    for u, i, t in test:
        test_dict[u - 1].add(i - 1)
    
    print(f"\nDataset: {n_users} users, {n_items} items")
    print(f"Train: {len(train)} interactions")
    print(f"Test: {len(test)} interactions, {len(test_dict)} users with test items")
    sparsity = 1.0 - len(train) / (n_users * n_items)
    print(f"Sparsity: {sparsity * 100:.3f}%")
    
    # ─── Baseline: Popularity ───
    print("\n" + "─" * 40)
    print("Evaluating: Popularity baseline...")
    pop_fn = lambda u: popularity_recommend(R_train, k=10, 
                        exclude_items=np.where(R_train[u].toarray().flatten() > 0)[0])
    pop_results = evaluate_model(pop_fn, R_train, test_dict)
    
    # ─── Item-kNN WITHOUT shrinkage ───
    print("\n" + "─" * 40)
    print("Computing item similarity (NO shrinkage, λ=0)...")
    sim_no_shrink = compute_item_similarity(R_train, shrinkage=0, k_neighbors=50)
    knn_fn = lambda u: item_knn_recommend(u, R_train, sim_no_shrink, k=10)
    knn_results = evaluate_model(knn_fn, R_train, test_dict)
    
    # ─── Item-kNN WITH shrinkage ───
    print("\n" + "─" * 40)
    print("Computing item similarity (WITH shrinkage, λ=100)...")
    sim_shrink = compute_item_similarity(R_train, shrinkage=100, k_neighbors=50)
    knn_s_fn = lambda u: item_knn_recommend(u, R_train, sim_shrink, k=10)
    knn_s_results = evaluate_model(knn_s_fn, R_train, test_dict)
    
    # ─── Shrinkage sweep (Module 11) ───
    print("\n" + "─" * 40)
    print("Shrinkage λ sweep: [0, 10, 50, 100, 200, 500]")
    for lam in [0, 10, 50, 100, 200, 500]:
        sim = compute_item_similarity(R_train, shrinkage=lam, k_neighbors=50)
        fn = lambda u, s=sim: item_knn_recommend(u, R_train, s, k=10)
        res = evaluate_model(fn, R_train, test_dict, n_eval=200)
        print(f"  λ={lam:>4d}: nDCG@10={res['nDCG@10']:.4f}")
    
    # ─── Final Leaderboard ───
    print("\n" + "=" * 60)
    print("  LEADERBOARD")
    print("=" * 60)
    print(f"{'Model':<25} {'nDCG@10':>8} {'P@10':>8} {'R@10':>8}")
    print("─" * 50)
    print(f"{'Popularity':<25} {pop_results['nDCG@10']:>8.4f} {pop_results['P@10']:>8.4f} {pop_results['R@10']:>8.4f}")
    print(f"{'Item-kNN (no shrink)':<25} {knn_results['nDCG@10']:>8.4f} {knn_results['P@10']:>8.4f} {knn_results['R@10']:>8.4f}")
    print(f"{'Item-kNN (λ=100)':<25} {knn_s_results['nDCG@10']:>8.4f} {knn_s_results['P@10']:>8.4f} {knn_s_results['R@10']:>8.4f}")
    print("─" * 50)
    
    lift = (knn_s_results['nDCG@10'] / pop_results['nDCG@10'] - 1) * 100 if pop_results['nDCG@10'] > 0 else 0
    print(f"\nkNN with shrinkage vs popularity: +{lift:.1f}% nDCG@10")
    print(f"\n✅ Lab 03 complete. Next: Lab 04 (BPR-MF training)")
