# %% [markdown]
# # 🧪 Lab 2 · Popularity + Content-Based Pipeline
# **Marevlo Research — Recommender Systems Track**
# 
# **Covers:** Modules 06–07 (Popularity Baselines + Content-Based Filtering)
# 
# **What you'll build:**
# 1. All 4 popularity variants: raw count, time-windowed, exponential decay, Bayesian average
# 2. TF-IDF content-based filtering with cosine similarity
# 3. User profile construction from interaction history
# 4. Head-to-head comparison on the same test set from Lab 1
# 5. Growing leaderboard: random < popularity < ???
#
# **Time:** ~45 minutes
# 
# **Prerequisites:** Complete Lab 1 (uses the same evaluation harness)

# %%
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from collections import Counter, defaultdict
import time

# === Rebuild from Lab 1 (or import if modularized) ===
np.random.seed(42)
n_users, n_items = 6040, 3952

# [Re-use Lab 1 data loading code — abbreviated here]
# In practice, import from Lab 1 or load saved artifacts
# For this lab, we'll regenerate the essentials:

def precision_at_k(ranked, rel, k):
    return len(set(ranked[:k]) & rel) / k

def recall_at_k(ranked, rel, k):
    return len(set(ranked[:k]) & rel) / max(len(rel), 1)

def ap_at_k(ranked, rel, k):
    h, s = 0, 0.0
    for i, item in enumerate(ranked[:k]):
        if item in rel:
            h += 1; s += h / (i+1)
    return s / max(len(rel), 1)

def ndcg_at_k(ranked, rel, k):
    d = sum(1/np.log2(i+2) for i, it in enumerate(ranked[:k]) if it in rel)
    ideal = sum(1/np.log2(i+2) for i in range(min(k, len(rel))))
    return d / ideal if ideal > 0 else 0.0

def evaluate_model(rec_fn, test_data, k=10):
    metrics = {'ndcg': [], 'precision': [], 'recall': [], 'map': []}
    for uid, rel_items in test_data.items():
        ranked = rec_fn(uid, k)
        rel = set(rel_items)
        metrics['ndcg'].append(ndcg_at_k(ranked, rel, k))
        metrics['precision'].append(precision_at_k(ranked, rel, k))
        metrics['recall'].append(recall_at_k(ranked, rel, k))
        metrics['map'].append(ap_at_k(ranked, rel, k))
    return {m: np.mean(v) for m, v in metrics.items()}

print("✅ Evaluation harness loaded from Lab 1")

# %% [markdown]
# ---
# ## Part 1: Generate Realistic Synthetic Data
# 
# We need timestamps for decay and genre tags for CBF.

# %%
# Generate ratings with timestamps
n_ratings = 200000  # Smaller for speed
users = np.random.randint(0, n_users, n_ratings)
items = np.random.randint(0, n_items, n_ratings)
ratings_vals = np.random.choice([1,2,3,4,5], n_ratings, p=[0.06,0.11,0.27,0.34,0.22])
timestamps = np.sort(np.random.randint(956_000_000, 1_046_000_000, n_ratings))

df = pd.DataFrame({'user_id': users, 'item_id': items, 'rating': ratings_vals, 'timestamp': timestamps})
df = df.drop_duplicates(['user_id','item_id'], keep='last')

# Temporal split
cutoff = df.timestamp.quantile(0.8)
train_df = df[df.timestamp < cutoff]
test_df = df[df.timestamp >= cutoff]
test_df = test_df[test_df.user_id.isin(train_df.user_id.unique())]

R_train = csr_matrix((train_df.rating.values.astype(np.float32),
                       (train_df.user_id.values, train_df.item_id.values)),
                      shape=(n_users, n_items))

test_data = {}
for _, row in test_df[test_df.rating >= 4].iterrows():
    test_data.setdefault(row.user_id, []).append(row.item_id)

# Generate synthetic genre tags for CBF
all_genres = ['action','comedy','drama','romance','thriller','scifi','horror',
              'documentary','animation','fantasy','mystery','adventure']
item_tags = {}
for i in range(n_items):
    n_tags = np.random.randint(1, 4)
    item_tags[i] = list(np.random.choice(all_genres, n_tags, replace=False))

print(f"Train: {len(train_df):,} ratings | Test users: {len(test_data):,}")
print(f"Items with tags: {len(item_tags):,}")
print(f"Example tags — item 0: {item_tags[0]}, item 42: {item_tags[42]}")

# %% [markdown]
# ---
# ## Part 2: Four Popularity Variants
# 
# **From DEEP M06:** Each variant uses a different scoring formula.
# 
# **📌 Task:** Implement all four, evaluate each.

# %%
# Variant 1: Raw count
item_counts = np.array(R_train.getnnz(axis=0))  # interactions per item
pop_raw = np.argsort(item_counts)[::-1]

def recommend_raw_pop(uid, k=10):
    seen = set(R_train[uid].indices)
    return [i for i in pop_raw if i not in seen][:k]

# Variant 2: Time-windowed (last 20% of training time)
time_cutoff = train_df.timestamp.quantile(0.8)
recent = train_df[train_df.timestamp >= time_cutoff]
recent_counts = Counter(recent.item_id)
pop_recent = sorted(range(n_items), key=lambda i: recent_counts.get(i, 0), reverse=True)

def recommend_windowed(uid, k=10):
    seen = set(R_train[uid].indices)
    return [i for i in pop_recent if i not in seen][:k]

# Variant 3: Exponential decay (λ=0.1 per day)
now = train_df.timestamp.max()
lam = 0.1 / 86400  # per second (0.1 per day)
decay_scores = defaultdict(float)
for _, row in train_df.iterrows():
    age = now - row.timestamp
    decay_scores[row.item_id] += np.exp(-lam * age)
pop_decay = sorted(range(n_items), key=lambda i: decay_scores.get(i, 0), reverse=True)

def recommend_decay(uid, k=10):
    seen = set(R_train[uid].indices)
    return [i for i in pop_decay if i not in seen][:k]

# Variant 4: Bayesian average (C=50)
C = 50
global_mean = train_df.rating.mean()
item_stats = train_df.groupby('item_id').rating.agg(['sum','count'])
bayesian_scores = {}
for i in range(n_items):
    if i in item_stats.index:
        s, n = item_stats.loc[i, 'sum'], item_stats.loc[i, 'count']
    else:
        s, n = 0, 0
    bayesian_scores[i] = (C * global_mean + s) / (C + n)
pop_bayesian = sorted(range(n_items), key=lambda i: bayesian_scores[i], reverse=True)

def recommend_bayesian(uid, k=10):
    seen = set(R_train[uid].indices)
    return [i for i in pop_bayesian if i not in seen][:k]

# Evaluate all four
print("=== Popularity Variants (M06) ===\n")
results = {}
for name, fn in [('Raw Count', recommend_raw_pop), ('Windowed', recommend_windowed),
                  ('Exp Decay', recommend_decay), ('Bayesian Avg', recommend_bayesian)]:
    t0 = time.time()
    m = evaluate_model(fn, test_data, k=10)
    elapsed = time.time() - t0
    results[name] = m
    print(f"{name:>12}: nDCG={m['ndcg']:.4f}  P@10={m['precision']:.4f}  R@10={m['recall']:.4f}  MAP={m['map']:.4f}  ({elapsed:.1f}s)")

# %% [markdown]
# ### 🧠 Checkpoint 1
# 
# **Questions:**
# 1. Which popularity variant performed best? Why?
# 2. Is the difference between variants statistically meaningful at this scale?
# 3. What does the Bayesian average do differently from raw count? (Recall DEEP M06)

# %% [markdown]
# ---
# ## Part 3: Content-Based Filtering (TF-IDF + Cosine)
# 
# **From DEEP M07:** Represent each item as a TF-IDF vector over its tags.
# Build a user profile by averaging their liked items' vectors.
# Score unseen items by cosine similarity to the profile.

# %%
# Build vocabulary
all_tags_set = set()
for tags in item_tags.values():
    all_tags_set.update(tags)
vocab = {tag: idx for idx, tag in enumerate(sorted(all_tags_set))}
V = len(vocab)

# Compute IDF
doc_freq = Counter()
for tags in item_tags.values():
    for t in set(tags):
        doc_freq[t] += 1
idf = np.zeros(V)
for tag, idx in vocab.items():
    idf[idx] = np.log(n_items / max(doc_freq[tag], 1))

# Build TF-IDF vectors for all items
item_vectors = np.zeros((n_items, V))
for i, tags in item_tags.items():
    for t in tags:
        if t in vocab:
            item_vectors[i, vocab[t]] = 1.0 * idf[vocab[t]]  # binary TF * IDF

# Normalize for cosine
norms = np.linalg.norm(item_vectors, axis=1, keepdims=True)
norms[norms == 0] = 1
item_vectors_normed = item_vectors / norms

print(f"Item vectors: {item_vectors.shape} (items × tags)")
print(f"Vocabulary: {V} unique tags")
print(f"IDF range: {idf.min():.2f} – {idf.max():.2f}")

# %%
# Build user profiles and recommend
def cbf_recommend(uid, k=10):
    """Content-based: user profile = avg of liked item vectors, score by cosine."""
    # User's training interactions (rating >= 3 as "liked")
    liked = R_train[uid].indices[R_train[uid].data >= 3]
    if len(liked) == 0:
        return list(range(k))  # fallback
    
    # User profile = mean of liked item vectors (already normalized)
    profile = item_vectors_normed[liked].mean(axis=0)
    prof_norm = np.linalg.norm(profile)
    if prof_norm == 0:
        return list(range(k))
    profile = profile / prof_norm
    
    # Score all items by cosine
    scores = item_vectors_normed @ profile
    
    # Exclude seen
    seen = set(R_train[uid].indices)
    for s in seen:
        scores[s] = -np.inf
    
    return np.argsort(scores)[-k:][::-1].tolist()

# Evaluate CBF
t0 = time.time()
cbf_metrics = evaluate_model(cbf_recommend, test_data, k=10)
elapsed = time.time() - t0
results['CBF (TF-IDF)'] = cbf_metrics

print("=== Content-Based Filtering (M07) ===")
print(f"   nDCG@10={cbf_metrics['ndcg']:.4f}  P@10={cbf_metrics['precision']:.4f}  R@10={cbf_metrics['recall']:.4f}  MAP={cbf_metrics['map']:.4f}  ({elapsed:.1f}s)")

# %% [markdown]
# ---
# ## Part 4: Leaderboard — Growing Model Comparison
# 
# **📌 This leaderboard grows with each lab.** Lab 3 adds kNN. Lab 4 adds BPR-MF.

# %%
print("\n" + "="*70)
print("  📊 LEADERBOARD — Labs 1–2")
print("="*70)
print(f"  {'Model':>15} {'nDCG@10':>10} {'P@10':>10} {'R@10':>10} {'MAP':>10}")
print("-"*70)

# Sort by nDCG descending
sorted_results = sorted(results.items(), key=lambda x: x[1]['ndcg'], reverse=True)
for rank, (name, m) in enumerate(sorted_results, 1):
    marker = "👑" if rank == 1 else "  "
    print(f"{marker} {name:>13} {m['ndcg']:>10.4f} {m['precision']:>10.4f} {m['recall']:>10.4f} {m['map']:>10.4f}")

print("="*70)
print("  Next: Lab 3 adds Item-kNN with shrinkage. Can it beat popularity?")

# %% [markdown]
# ---
# ## 🏁 Lab 2 Complete
# 
# **What you built:**
# - ✅ All 4 popularity variants from M06 (raw, windowed, decay, Bayesian)
# - ✅ TF-IDF content-based filtering from M07 (vocabulary, IDF, user profiles, cosine scoring)
# - ✅ Head-to-head comparison on same temporal test set
# - ✅ Growing leaderboard
# 
# **Key insight from this lab:**
# Popularity baselines are non-personalized but can be surprisingly strong.
# CBF personalizes from day one but is limited by tag vocabulary.
# The real test comes in Lab 3 when collaborative filtering enters — 
# can it discover patterns that tags miss?
#
# **Next:** Lab 3 — Item-kNN with Shrinkage (M08–M13)
