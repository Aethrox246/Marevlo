# %% [markdown]
# # 🧪 Lab 1 · Build Your First Interaction Matrix
# **Marevlo Research — Recommender Systems Track**
# 
# **Covers:** Modules 01–05 (Act I: Problem Framing)
# 
# **What you'll build:**
# 1. Load MovieLens 1M dataset and explore its structure
# 2. Build a sparse interaction matrix from raw ratings
# 3. Compute sparsity and compare to Kartify's numbers
# 4. Implement temporal train-test split (NOT random!)
# 5. Implement all ranking metrics from scratch: Precision@K, Recall@K, AP@K, nDCG@K
# 6. Evaluate a dummy baseline and verify your metrics by hand
#
# **Time:** ~45 minutes
# 
# **Prerequisites:** numpy, scipy, pandas installed. Run `pip install numpy scipy pandas` if needed.

# %%
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from collections import defaultdict
import time

print("✅ Libraries loaded. Let's build.")

# %% [markdown]
# ---
# ## Part 1: Load MovieLens 1M
# 
# MovieLens 1M has ~1M ratings from 6,040 users on 3,952 movies.
# This is the classic recsys benchmark — small enough to run on a laptop,
# large enough to show real patterns.
#
# **📌 Task:** Download MovieLens 1M from https://grouplens.org/datasets/movielens/1m/
# and place `ratings.dat` in the same directory, OR use the synthetic data below.

# %%
# === Option A: Load real MovieLens 1M ===
# Uncomment these lines if you have the file:
# ratings = pd.read_csv('ratings.dat', sep='::', header=None,
#                        names=['user_id', 'item_id', 'rating', 'timestamp'],
#                        engine='python')

# === Option B: Generate synthetic data with similar properties ===
np.random.seed(42)
n_users, n_items, n_ratings = 6040, 3952, 1000209

users = np.random.randint(1, n_users + 1, n_ratings)
items = np.random.randint(1, n_items + 1, n_ratings)
# Power-law distribution for ratings (most items get few ratings)
ratings_vals = np.random.choice([1, 2, 3, 4, 5], n_ratings, p=[0.06, 0.11, 0.27, 0.34, 0.22])
timestamps = np.sort(np.random.randint(956_000_000, 1_046_000_000, n_ratings))

ratings = pd.DataFrame({
    'user_id': users, 'item_id': items,
    'rating': ratings_vals, 'timestamp': timestamps
})
# Deduplicate (keep latest rating per user-item pair)
ratings = ratings.drop_duplicates(subset=['user_id', 'item_id'], keep='last')

print(f"Dataset: {len(ratings):,} ratings")
print(f"Users:   {ratings.user_id.nunique():,}")
print(f"Items:   {ratings.item_id.nunique():,}")
print(f"\nFirst 5 rows:")
ratings.head()

# %% [markdown]
# ---
# ## Part 2: Build the Sparse Interaction Matrix
# 
# **From DEEP M01:** The interaction matrix $R$ is an $M \times N$ table where
# $R_{ui}$ = user $u$'s rating of item $i$. Most cells are empty.
# 
# **📌 Task:** Build `R` as a scipy sparse CSR matrix.
# Compare the memory of sparse vs dense representation.

# %%
# Step 1: Create contiguous integer ID mappings
user_ids = sorted(ratings.user_id.unique())
item_ids = sorted(ratings.item_id.unique())
uid_map = {uid: idx for idx, uid in enumerate(user_ids)}
iid_map = {iid: idx for idx, iid in enumerate(item_ids)}

M = len(user_ids)
N = len(item_ids)

# Step 2: Map to indices
rows = ratings.user_id.map(uid_map).values
cols = ratings.item_id.map(iid_map).values
vals = ratings.rating.values.astype(np.float32)

# Step 3: Build sparse matrix
R = csr_matrix((vals, (rows, cols)), shape=(M, N))

print(f"R shape:     {R.shape}")
print(f"Nonzeros:    {R.nnz:,}")
print(f"Fill rate:   {R.nnz / (M * N):.4%}")
print(f"Sparsity:    {100 - R.nnz / (M * N) * 100:.3f}%")
print(f"\nSparse memory:  {(R.data.nbytes + R.indices.nbytes + R.indptr.nbytes) / 1e6:.1f} MB")
print(f"Dense memory:   {M * N * 4 / 1e6:.1f} MB")
print(f"Compression:    {M * N * 4 / (R.data.nbytes + R.indices.nbytes + R.indptr.nbytes):.0f}x")

# %% [markdown]
# ### 🧠 Checkpoint 1
# 
# **Compare your numbers to Kartify (from DEEP M01):**
# - Kartify: 2.3M users × 480K items = 1.1T cells, 18M interactions, 0.00163% fill
# - MovieLens 1M: ~6K users × ~4K items = ~24M cells, ~1M ratings, ~4.2% fill
# 
# **Question:** MovieLens is ~2,500× denser than Kartify. What does this mean
# for algorithm choice? (Hint: neighborhood methods work better on denser data.)

# %%
# === YOUR ANALYSIS HERE ===
# Write 2-3 sentences about what the density difference means:
#
# analysis = """
# 
# """
# print(analysis)

# %% [markdown]
# ---
# ## Part 3: Temporal Train-Test Split
# 
# **From DEEP M05:** Never use random splits for recsys! Train on the past,
# test on the future. This simulates real deployment.
# 
# **📌 Task:** Split by timestamp — last 20% of time → test, rest → train.

# %%
def temporal_split(df, test_frac=0.2):
    """Split interactions by time. Last test_frac of time → test."""
    cutoff = df.timestamp.quantile(1 - test_frac)
    train = df[df.timestamp < cutoff].copy()
    test = df[df.timestamp >= cutoff].copy()
    
    # Only keep test users/items that exist in training
    test = test[test.user_id.isin(train.user_id.unique())]
    test = test[test.item_id.isin(train.item_id.unique())]
    
    return train, test

train_df, test_df = temporal_split(ratings, test_frac=0.2)

print(f"Train: {len(train_df):,} ratings ({len(train_df)/len(ratings):.1%})")
print(f"Test:  {len(test_df):,} ratings ({len(test_df)/len(ratings):.1%})")
print(f"\nTrain period: {pd.to_datetime(train_df.timestamp.min(), unit='s').date()} → {pd.to_datetime(train_df.timestamp.max(), unit='s').date()}")
print(f"Test period:  {pd.to_datetime(test_df.timestamp.min(), unit='s').date()} → {pd.to_datetime(test_df.timestamp.max(), unit='s').date()}")

# Build training matrix
train_rows = train_df.user_id.map(uid_map).values
train_cols = train_df.item_id.map(iid_map).values
train_vals = train_df.rating.values.astype(np.float32)
R_train = csr_matrix((train_vals, (train_rows, train_cols)), shape=(M, N))

# Build test data: {user_idx: [list of item_idxs they rated 4+]}
test_data = {}
for _, row in test_df[test_df.rating >= 4].iterrows():
    u = uid_map[row.user_id]
    i = iid_map[row.item_id]
    if u not in test_data:
        test_data[u] = []
    test_data[u].append(i)

print(f"\nTest users with relevant items (rating ≥ 4): {len(test_data):,}")

# %% [markdown]
# ---
# ## Part 4: Ranking Metrics — From Scratch
# 
# **From DEEP M05:** Every metric computed by hand, then coded.
# 
# **📌 Task:** Implement Precision@K, Recall@K, AP@K, nDCG@K from scratch.
# Then verify on the hand-computed example from DEEP M05.

# %%
def precision_at_k(ranked_list, relevant_set, k):
    """Fraction of top-k that are relevant."""
    return len(set(ranked_list[:k]) & relevant_set) / k

def recall_at_k(ranked_list, relevant_set, k):
    """Fraction of relevant items found in top-k."""
    return len(set(ranked_list[:k]) & relevant_set) / max(len(relevant_set), 1)

def ap_at_k(ranked_list, relevant_set, k):
    """Average Precision at k."""
    hits, sum_prec = 0, 0.0
    for i, item in enumerate(ranked_list[:k]):
        if item in relevant_set:
            hits += 1
            sum_prec += hits / (i + 1)
    return sum_prec / max(len(relevant_set), 1)

def ndcg_at_k(ranked_list, relevant_set, k):
    """Normalized Discounted Cumulative Gain at k."""
    dcg = sum(1.0 / np.log2(i + 2) for i, item in enumerate(ranked_list[:k])
              if item in relevant_set)
    idcg = sum(1.0 / np.log2(i + 2) for i in range(min(k, len(relevant_set))))
    return dcg / idcg if idcg > 0 else 0.0

# %% [markdown]
# ### 🧪 Verification: Match DEEP M05's hand-computed example
# 
# From DEEP M05 D2:
# - Relevant items: {A, C, F, H} (mapped to indices 0, 2, 5, 7)
# - Model ranking: [C, X, A, Y, F] → [2, 99, 0, 98, 5]
# - Expected: P@5=0.600, R@5=0.750, AP@5=0.567, nDCG@5=0.737

# %%
# Verify against hand-computed values from DEEP M05
relevant = {0, 2, 5, 7}  # A, C, F, H
ranking = [2, 99, 0, 98, 5]  # C, X, A, Y, F

p5 = precision_at_k(ranking, relevant, 5)
r5 = recall_at_k(ranking, relevant, 5)
ap5 = ap_at_k(ranking, relevant, 5)
ndcg5 = ndcg_at_k(ranking, relevant, 5)

print("=== Verification against DEEP M05 ===")
print(f"Precision@5:  {p5:.3f}  (expected: 0.600)  {'✅' if abs(p5 - 0.600) < 0.01 else '❌'}")
print(f"Recall@5:     {r5:.3f}  (expected: 0.750)  {'✅' if abs(r5 - 0.750) < 0.01 else '❌'}")
print(f"AP@5:         {ap5:.3f}  (expected: 0.567)  {'✅' if abs(ap5 - 0.567) < 0.01 else '❌'}")
print(f"nDCG@5:       {ndcg5:.3f}  (expected: 0.737)  {'✅' if abs(ndcg5 - 0.737) < 0.01 else '❌'}")

# %% [markdown]
# ---
# ## Part 5: Evaluate a Baseline — Global Popularity
# 
# **From M06:** The simplest recommender ranks items by popularity.
# It's non-personalized but surprisingly hard to beat on sparse data.
# 
# **📌 Task:** Build a popularity baseline, evaluate it on the test set.

# %%
def evaluate_model(recommend_fn, test_data, k=10):
    """Evaluate a recommendation function on test users."""
    metrics = {'ndcg': [], 'precision': [], 'recall': [], 'map': []}
    for user_id, relevant_items in test_data.items():
        ranked = recommend_fn(user_id, k)
        rel = set(relevant_items)
        metrics['ndcg'].append(ndcg_at_k(ranked, rel, k))
        metrics['precision'].append(precision_at_k(ranked, rel, k))
        metrics['recall'].append(recall_at_k(ranked, rel, k))
        metrics['map'].append(ap_at_k(ranked, rel, k))
    return {m: np.mean(v) for m, v in metrics.items()}

# Popularity baseline: rank items by total interaction count in training data
item_popularity = np.array(R_train.sum(axis=0)).flatten()
popular_items = np.argsort(item_popularity)[::-1]

def popularity_recommend(user_id, k=10):
    """Recommend top-k most popular items not in user's training history."""
    seen = set(R_train[user_id].indices)
    recs = [i for i in popular_items if i not in seen][:k]
    return recs

# Evaluate
start = time.time()
pop_metrics = evaluate_model(popularity_recommend, test_data, k=10)
elapsed = time.time() - start

print("=== Popularity Baseline (M06) ===")
for metric, value in pop_metrics.items():
    print(f"  {metric:>10}: {value:.4f}")
print(f"  {'time':>10}: {elapsed:.1f}s")

# %% [markdown]
# ### 🧠 Checkpoint 2 — Reflect
# 
# **Questions to answer before moving on:**
# 
# 1. Is the popularity baseline's nDCG@10 above or below what you expected?
# 2. Why is precision generally low? (Hint: think about how many relevant 
#    items each user has vs the list size of 10.)
# 3. The popularity baseline is the same for every user. Can it ever 
#    outperform a personalized model? When? (Hint: Module 06, Section 4.)

# %%
# === YOUR ANSWERS HERE ===
# answer_1 = ""
# answer_2 = ""
# answer_3 = ""

# %% [markdown]
# ---
# ## Part 6: Random Baseline — The Floor
# 
# Every model should beat random. Let's verify our metrics make sense.

# %%
def random_recommend(user_id, k=10):
    """Recommend k random items not in training history."""
    seen = set(R_train[user_id].indices)
    candidates = [i for i in range(N) if i not in seen]
    return list(np.random.choice(candidates, min(k, len(candidates)), replace=False))

random_metrics = evaluate_model(random_recommend, test_data, k=10)

print("=== Random Baseline (the floor) ===")
for metric, value in random_metrics.items():
    print(f"  {metric:>10}: {value:.4f}")

print("\n=== Comparison ===")
print(f"  {'':>10} {'Random':>10} {'Popular':>10} {'Lift':>10}")
for metric in ['ndcg', 'precision', 'recall', 'map']:
    r = random_metrics[metric]
    p = pop_metrics[metric]
    lift = (p - r) / max(r, 1e-10) * 100
    print(f"  {metric:>10} {r:>10.4f} {p:>10.4f} {lift:>9.0f}%")

# %% [markdown]
# ---
# ## 🏁 Lab 1 Complete
# 
# **What you built:**
# - ✅ Sparse interaction matrix from raw data
# - ✅ Sparsity analysis with Kartify comparison
# - ✅ Temporal train-test split (not random!)
# - ✅ All 4 ranking metrics from scratch, verified against DEEP M05
# - ✅ Evaluation harness (reusable in every future lab)
# - ✅ Popularity baseline — the bar to beat
# - ✅ Random baseline — the floor
# 
# **This evaluation harness carries forward to every subsequent lab.**
# In Lab 2, you'll add CBF and compare. In Lab 3, item-kNN. 
# In Lab 4, BPR-MF. Same metrics, same test set, growing leaderboard.
#
# **Next:** Lab 2 — Popularity + CBF Pipeline
