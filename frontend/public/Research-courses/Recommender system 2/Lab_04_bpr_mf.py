"""
Lab 04 · BPR-MF — Train Your First Latent Factor Model
Marevlo Research — Recommender Systems Track

Covers: M14 (MF Decomposition), M16 (BPR Loss), DEEP M16 (BPR Derivation)

Run: python Lab_04_bpr_mf.py

Requirements: numpy, scipy, torch, pandas, matplotlib (optional for plots)
Dataset: MovieLens 100K (auto-downloaded)
"""

import numpy as np
import os, urllib.request, zipfile, time
from scipy.sparse import csr_matrix
from collections import defaultdict

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    print("⚠️  PyTorch not installed. Install with: pip install torch")
    print("    This lab requires PyTorch for BPR-MF training.")
    exit(1)


# ═══════════════════════════════════════════════════════════════
# 1. DATA LOADING (reuse from Lab 03)
# ═══════════════════════════════════════════════════════════════

def load_movielens_100k(min_rating=4.0):
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
            parts = line.strip().split("\t")
            uid, iid, rating, ts = int(parts[0]), int(parts[1]), float(parts[2]), int(parts[3])
            if rating >= min_rating:
                ratings.append((uid - 1, iid - 1, ts))
    ratings.sort(key=lambda x: x[2])
    return ratings


def temporal_split(ratings, test_fraction=0.2):
    split_idx = int(len(ratings) * (1 - test_fraction))
    return ratings[:split_idx], ratings[split_idx:]


# ═══════════════════════════════════════════════════════════════
# 2. BPR-MF MODEL (DEEP M16 — from scratch)
# ═══════════════════════════════════════════════════════════════

class BPR_MF(nn.Module):
    """
    Bayesian Personalized Ranking with Matrix Factorization.
    
    From DEEP M16:
    P(user u prefers item i over item j) = σ(x_uij)
    where x_uij = u·i - u·j (difference of dot products)
    
    Loss = -Σ log σ(x_uij) + λ||Θ||²
    """
    
    def __init__(self, n_users, n_items, k=64):
        super().__init__()
        self.user_emb = nn.Embedding(n_users, k)
        self.item_emb = nn.Embedding(n_items, k)
        
        # Initialize with small random values (Module 14)
        nn.init.normal_(self.user_emb.weight, std=0.01)
        nn.init.normal_(self.item_emb.weight, std=0.01)
    
    def forward(self, users, pos_items, neg_items):
        u = self.user_emb(users)        # (batch, k)
        i_pos = self.item_emb(pos_items) # (batch, k)
        i_neg = self.item_emb(neg_items) # (batch, k)
        
        # x_uij = dot(u, i_pos) - dot(u, i_neg)
        pos_scores = (u * i_pos).sum(dim=1)  # (batch,)
        neg_scores = (u * i_neg).sum(dim=1)  # (batch,)
        x_uij = pos_scores - neg_scores
        
        return x_uij
    
    def predict(self, user_idx):
        """Score all items for a user (for evaluation)."""
        u = self.user_emb.weight[user_idx]  # (k,)
        scores = self.item_emb.weight @ u   # (n_items,)
        return scores.detach().cpu().numpy()


# ═══════════════════════════════════════════════════════════════
# 3. BPR TRAINING LOOP
# ═══════════════════════════════════════════════════════════════

def train_bpr(model, train_interactions, n_items, epochs=20, lr=0.005, 
              reg=0.001, batch_size=4096, verbose=True):
    """
    Train BPR-MF with uniform negative sampling.
    
    Each training step:
    1. Sample a (user, positive_item) pair from interactions
    2. Sample a random negative_item (not in user's history)
    3. Compute BPR loss: -log σ(x_uij) + regularization
    """
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=reg)
    device = next(model.parameters()).device
    
    # Build user → items dict for negative sampling
    user_items = defaultdict(set)
    for u, i, t in train_interactions:
        user_items[u].add(i)
    
    users_arr = np.array([u for u, i, t in train_interactions])
    items_arr = np.array([i for u, i, t in train_interactions])
    
    loss_history = []
    
    for epoch in range(epochs):
        model.train()
        epoch_loss = 0.0
        n_batches = 0
        
        # Shuffle training data
        perm = np.random.permutation(len(train_interactions))
        
        for start in range(0, len(perm), batch_size):
            batch_idx = perm[start:start + batch_size]
            
            batch_users = torch.LongTensor(users_arr[batch_idx]).to(device)
            batch_pos = torch.LongTensor(items_arr[batch_idx]).to(device)
            
            # Sample negatives (uniform random, excluding positives)
            neg_items = []
            for idx in batch_idx:
                u = users_arr[idx]
                neg = np.random.randint(n_items)
                while neg in user_items[u]:
                    neg = np.random.randint(n_items)
                neg_items.append(neg)
            batch_neg = torch.LongTensor(neg_items).to(device)
            
            # Forward + loss
            x_uij = model(batch_users, batch_pos, batch_neg)
            loss = -torch.log(torch.sigmoid(x_uij) + 1e-10).mean()
            
            # Backward
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            n_batches += 1
        
        avg_loss = epoch_loss / n_batches
        loss_history.append(avg_loss)
        
        if verbose:
            print(f"  Epoch {epoch+1:>2d}/{epochs}: loss={avg_loss:.4f}")
    
    return loss_history


# ═══════════════════════════════════════════════════════════════
# 4. EVALUATION (same harness as Lab 03)
# ═══════════════════════════════════════════════════════════════

def dcg_at_k(relevance, k):
    relevance = np.array(relevance[:k])
    return np.sum(relevance / np.log2(np.arange(1, len(relevance) + 1) + 1))

def ndcg_at_k(recommended, relevant_set, k):
    relevance = [1.0 if item in relevant_set else 0.0 for item in recommended[:k]]
    dcg = dcg_at_k(relevance, k)
    ideal = dcg_at_k(sorted(relevance, reverse=True), k)
    return dcg / ideal if ideal > 0 else 0.0

def precision_at_k(recommended, relevant_set, k):
    return sum(1 for item in recommended[:k] if item in relevant_set) / k

def recall_at_k(recommended, relevant_set, k):
    if not relevant_set: return 0.0
    return sum(1 for item in recommended[:k] if item in relevant_set) / len(relevant_set)

def evaluate_bpr(model, R_train, test_dict, k=10, n_eval=500):
    model.eval()
    ndcgs, precs, recalls = [], [], []
    eval_users = [u for u in test_dict if len(test_dict[u]) > 0][:n_eval]
    
    with torch.no_grad():
        for user_idx in eval_users:
            scores = model.predict(user_idx)
            # Exclude seen items
            seen = set(R_train[user_idx].nonzero()[1])
            scores[list(seen)] = -np.inf
            
            top_k = np.argsort(scores)[-k:][::-1]
            relevant = test_dict[user_idx]
            
            ndcgs.append(ndcg_at_k(top_k, relevant, k))
            precs.append(precision_at_k(top_k, relevant, k))
            recalls.append(recall_at_k(top_k, relevant, k))
    
    return {"nDCG@10": np.mean(ndcgs), "P@10": np.mean(precs), "R@10": np.mean(recalls)}


# ═══════════════════════════════════════════════════════════════
# 5. MAIN
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("  Lab 04 · BPR-MF — Train Your First Latent Factor Model")
    print("  Marevlo Research — Recommender Systems Track")
    print("=" * 60)
    
    # Load data
    ratings = load_movielens_100k()
    train, test = temporal_split(ratings)
    n_users = max(r[0] for r in ratings) + 1
    n_items = max(r[1] for r in ratings) + 1
    
    R_train = csr_matrix(
        ([1.0] * len(train), ([u for u, i, t in train], [i for u, i, t in train])),
        shape=(n_users, n_items)
    )
    
    test_dict = defaultdict(set)
    for u, i, t in test:
        test_dict[u].add(i)
    
    print(f"\n{n_users} users, {n_items} items, {len(train)} train, {len(test)} test")
    
    # ─── Train BPR-MF ───
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nDevice: {device}")
    
    # Hyperparameter search (Module 26: start simple)
    configs = [
        {"k": 64, "lr": 0.005, "reg": 0.001},
        {"k": 128, "lr": 0.005, "reg": 0.001},
        {"k": 128, "lr": 0.001, "reg": 0.01},
    ]
    
    best_ndcg = 0
    best_config = None
    best_model = None
    
    for cfg in configs:
        print(f"\n{'─' * 40}")
        print(f"Training: k={cfg['k']}, lr={cfg['lr']}, reg={cfg['reg']}")
        
        model = BPR_MF(n_users, n_items, k=cfg["k"]).to(device)
        t0 = time.time()
        losses = train_bpr(model, train, n_items, epochs=15, 
                          lr=cfg["lr"], reg=cfg["reg"])
        train_time = time.time() - t0
        
        results = evaluate_bpr(model, R_train, test_dict)
        print(f"  → nDCG@10={results['nDCG@10']:.4f} P@10={results['P@10']:.4f} "
              f"R@10={results['R@10']:.4f} ({train_time:.1f}s)")
        
        if results["nDCG@10"] > best_ndcg:
            best_ndcg = results["nDCG@10"]
            best_config = cfg
            best_model = model
            best_losses = losses
    
    # ─── Best model results ───
    print(f"\n{'=' * 60}")
    print(f"  BEST CONFIG: k={best_config['k']}, lr={best_config['lr']}, reg={best_config['reg']}")
    print(f"  nDCG@10 = {best_ndcg:.4f}")
    print(f"{'=' * 60}")
    
    # ─── Embedding analysis ───
    print("\nEmbedding analysis:")
    item_emb = best_model.item_emb.weight.detach().cpu().numpy()
    print(f"  Item embedding shape: {item_emb.shape}")
    print(f"  Mean norm: {np.linalg.norm(item_emb, axis=1).mean():.4f}")
    print(f"  Std norm:  {np.linalg.norm(item_emb, axis=1).std():.4f}")
    
    # ─── Sample recommendations ───
    print("\nSample recommendations for 3 test users:")
    sample_users = [u for u in test_dict if len(test_dict[u]) >= 3][:3]
    for u in sample_users:
        scores = best_model.predict(u)
        seen = set(R_train[u].nonzero()[1])
        scores[list(seen)] = -np.inf
        top5 = np.argsort(scores)[-5:][::-1]
        relevant = test_dict[u]
        hits = [("✓" if i in relevant else "·") for i in top5]
        print(f"  User {u}: recommend items {top5.tolist()} | hits: {' '.join(hits)}")
    
    # ─── Loss curve ───
    print(f"\nLoss curve (best model):")
    for i, loss in enumerate(best_losses):
        bar = "█" * int(loss * 40)
        print(f"  Epoch {i+1:>2d}: {loss:.4f} {bar}")
    
    print(f"\n✅ Lab 04 complete. Model saved in memory.")
    print(f"   Next: Lab 05 (FAISS ANN serving benchmark)")
