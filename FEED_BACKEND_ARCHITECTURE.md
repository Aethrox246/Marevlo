# Marevlo Feed System - Backend Architecture

**Date**: March 2026  
**Purpose**: Real-time social feed for coding discussions  
**Status**: Proposed (Phase 1 Implementation)

---

## 1. Executive Summary

The Feed system allows users to:
- **Share solutions/approaches** to coding problems
- **Discuss problem-solving strategies** with the community
- **Like quality content** (simple like system matching UI)
- **Post articles and events** (with titles, images, dates, locations)
- **Comment on posts** to provide feedback and discussion
- **Optional: Tag and link to problems** for future phases

**Expected Impact**: Increases user engagement by 40-60% through peer learning

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Feed.jsx → CreatePost, FeedPost, Comments Components       │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ HTTP/REST API
                              │ (JSON over HTTPS)
┌─────────────────────────────┼──────────────────────────────────────┐
│                    API LAYER (FastAPI)                             │
│  Port: 8000                 │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │ Authentication Middleware                                    │   │
│  │  • JWT token validation                                      │   │
│  │  • User identification (extract user_id from token)         │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │ /feed Router (feed.py)                                       │   │
│  │  ├─ POST   /feed/posts          → Create post               │   │
│  │  ├─ GET    /feed/posts          → List feed (paginated)     │   │
│  │  ├─ GET    /feed/posts/{id}     → Get single post           │   │
│  │  ├─ DELETE /feed/posts/{id}     → Delete own post           │   │
│  │  ├─ POST   /feed/posts/{id}/like        → Toggle like       │   │
│  │  ├─ POST   /feed/posts/{id}/comments    → Add comment       │   │
│  │  └─ GET    /feed/posts/{id}/comments    → List comments     │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ SQLAlchemy ORM
                              │ (Query Builder)
┌─────────────────────────────┼──────────────────────────────────────┐
│                  DATABASE LAYER (PostgreSQL)                        │
│  Port: 5432                 │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │                                                              │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐   │   │
│  │  │ posts          │  │ post_likes     │  │ comments     │   │   │
│  │  │ ─────────────  │  │ ─────────────  │  │ ──────────── │   │   │
│  │  │ id (PK)        │  │ id (PK)        │  │ id (PK)      │   │   │
│  │  │ user_id (FK)   │◄─┤ post_id (FK)   │  │ post_id (FK) │   │   │
│  │  │ type           │  │ user_id (FK)   │  │ user_id (FK) │   │   │
│  │  │ content        │  │ created_at     │  │ content      │   │   │
│  │  │ title          │  │                │  │ created_at   │   │   │
│  │  │ image_url      │  └────────────────┘  └──────────────┘   │   │
│  │  │ like_count     │  (UNIQUE: post_id, user_id)              │   │
│  │  │ comment_count  │  Prevents double liking                  │   │
│  │  │ repost_count   │                                          │   │
│  │  │ tags (JSON)    │                                          │   │
│  │  │ code_snippet   │                                          │   │
│  │  │ problem_id     │                                          │   │
│  │  │ event_date     │  (optional)                              │   │
│  │  │ event_location │  (optional)                              │   │
│  │  │ created_at     │                                          │   │
│  │  │ updated_at     │                                          │   │
│  │  └────────────────┘                                          │   │
│  │         ▲                                                     │   │
│  │         │ (likes relation)                                   │   │
│  │         └─────────────────────────────────────────────────   │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Existing Tables (already connected):                               │
│  ├─ users (id, username, email, ...)                              │
│  ├─ problems (id, title, slug, ...)                               │
│  └─ profiles (user_id, name, bio, ...)                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Table: `posts`

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'post',      -- post, article, event, repost
    content TEXT NOT NULL,
    title VARCHAR(255),                    -- optional, for articles/events
    image_url VARCHAR(500),                -- optional, for articles/cover images
    like_count INTEGER DEFAULT 0,          -- simple like counter
    comment_count INTEGER DEFAULT 0,
    repost_count INTEGER DEFAULT 0,
    
    -- Optional fields (for future features)
    tags JSONB DEFAULT '[]',              -- [{"name": "#dp"}, {...}]
    code_snippet JSONB,                    -- {"language": "python", "code": "..."}
    problem_id INTEGER REFERENCES problems(id) ON DELETE SET NULL,  -- optional
    
    -- Event-specific fields (only for type='event')
    event_date TIMESTAMP,                 -- date of the event
    event_location VARCHAR(255),          -- location of the event
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_problem_id ON posts(problem_id);
```

### Table: `post_likes`

```sql
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent one user from liking same post twice
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
```

### Table: `comments`

```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
```



---

## 4. API Endpoints Specification

### Feed List Endpoint

```
GET /feed/posts

Query Parameters:
  - sort: "latest" | "top" (default: "latest")
  - page: integer (default: 1)
  - limit: integer (default: 20, max: 100)

Headers Required:
  Authorization: Bearer <access_token>

Response (200 OK):
{
  "posts": [
    {
      "id": 1,
      "author": {
        "id": 5,
        "username": "sudha",
        "avatar": "S"
      },
      "type": "post",
      "content": "Just solved the Alien Dictionary problem! Here's my approach...",
      "title": null,
      "image_url": null,
      "like_count": 45,
      "comment_count": 8,
      "repost_count": 2,
      "liked_by_me": true,
      "tags": [],
      "code_snippet": null,
      "problem_id": null,
      "event_date": null,
      "event_location": null,
      "created_at": "2026-03-12T10:30:00Z",
      "updated_at": "2026-03-12T10:30:00Z"
    },
    {
      "id": 2,
      "author": {
        "id": 6,
        "username": "arjun",
        "avatar": "A"
      },
      "type": "article",
      "content": "A complete guide to mastering Graph algorithms...",
      "title": "Graph Algorithms Masterclass",
      "image_url": "https://cdn.example.com/article-cover.jpg",
      "like_count": 120,
      "comment_count": 5,
      "repost_count": 0,
      "liked_by_me": false,
      "tags": ["#graph", "#algorithms"],
      "code_snippet": null,
      "problem_id": null,
      "event_date": null,
      "event_location": null,
      "created_at": "2026-03-11T15:20:00Z",
      "updated_at": "2026-03-11T15:20:00Z"
    },
    {
      "id": 3,
      "author": {
        "id": 7,
        "username": "priya",
        "avatar": "P"
      },
      "type": "event",
      "content": "Join us for a live coding session on Dynamic Programming!",
      "title": "Live DP Workshop",
      "image_url": null,
      "like_count": 32,
      "comment_count": 12,
      "repost_count": 8,
      "liked_by_me": false,
      "tags": ["#dp", "#live", "#workshop"],
      "code_snippet": null,
      "problem_id": null,
      "event_date": "2026-03-15T18:00:00Z",
      "event_location": "Online (Discord)",
      "created_at": "2026-03-12T09:00:00Z",
      "updated_at": "2026-03-12T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_count": 156,
    "total_pages": 8
  }
}
```

### Create Post Endpoint

```
POST /feed/posts

Headers Required:
  Authorization: Bearer <access_token>
  Content-Type: application/json

Request Body (Regular Post):
{
  "content": "Just solved problem #47! Here's my approach...",
  "type": "post"
}

Request Body (Article):
{
  "content": "A complete guide to graph algorithms...",
  "type": "article",
  "title": "Graph Algorithms Masterclass",
  "image_url": "https://example.com/image.jpg"
}

Request Body (Event):
{
  "content": "Join us for a live DP workshop!",
  "type": "event",
  "title": "Live DP Workshop",
  "event_date": "2026-03-15T18:00:00Z",
  "event_location": "Online (Discord)"
}

Optional Fields (for any type):
  "tags": ["#dp", "#tree"],
  "code_snippet": {"language": "python", "code": "..."},
  "problem_id": 47

Response (201 Created):
{
  "id": 156,
  "user_id": 5,
  "author": {
    "id": 5,
    "username": "sudha",
    "avatar": "S"
  },
  "type": "post",
  "content": "Just solved problem #47!...",
  "like_count": 0,
  "comment_count": 0,
  "repost_count": 0,
  "liked_by_me": false,
  "created_at": "2026-03-12T11:00:00Z",
  "updated_at": "2026-03-12T11:00:00Z"
}

Error Responses:
  400 Bad Request - Invalid input (missing content)
  401 Unauthorized - No valid JWT token
  403 Forbidden - User is suspended
```

### Like Post Endpoint

```
POST /feed/posts/{post_id}/like

Headers Required:
  Authorization: Bearer <access_token>

Response (200 OK):
{
  "id": <post_id>,
  "liked_by_me": true,
  "like_count": 46
}

Logic:
  • First call: creates a like (user likes the post)
  • Second call: removes the like (user unlikes the post)
  • Toggle action with UNIQUE constraint to prevent double liking
```

### Add Comment Endpoint

```
POST /feed/posts/{post_id}/comments

Request Body:
{
  "content": "Great approach! I didn't think of this optimization."
}

Response (201 Created):
{
  "id": 234,
  "post_id": 1,
  "user_id": 5,
  "author": {
    "username": "sudha"
  },
  "content": "Great approach!...",
  "created_at": "2026-03-12T11:00:00Z"
}
```



---

## 5. Pydantic Schemas (Input/Output Validation)

### FeedPostCreate - Input Schema

```python
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FeedPostCreate(BaseModel):
    """Schema for creating a new post"""
    content: str                           # Required
    type: str = "post"                    # post, article, event, repost
    title: Optional[str] = None           # For articles & events
    image_url: Optional[str] = None       # For articles & cover images
    event_date: Optional[datetime] = None # For events
    event_location: Optional[str] = None  # For events
    
    # Optional enrichment fields
    tags: Optional[List[str]] = None      # ["#dp", "#tree"]
    code_snippet: Optional[dict] = None   # {"language": "python", "code": "..."}
    problem_id: Optional[int] = None      # Link to a problem
    
    class Config:
        example = {
            "content": "Just solved problem #47!",
            "type": "post",
            "tags": ["#dp"],
            "problem_id": 47
        }
```

### FeedPostResponse - Output Schema

```python
class UserSummary(BaseModel):
    """Minimal user info for post author"""
    id: int
    username: str
    avatar: str  # Single letter avatar

class FeedPostResponse(BaseModel):
    """Complete post info for API responses"""
    id: int
    user_id: int
    author: UserSummary
    type: str                         # post, article, event, repost
    content: str
    title: Optional[str]
    image_url: Optional[str]
    
    # Counters
    like_count: int
    comment_count: int
    repost_count: int
    liked_by_me: bool                 # Whether current user liked this
    
    # Optional enrichment fields
    tags: List[str] = []
    code_snippet: Optional[dict] = None
    problem_id: Optional[int] = None
    
    # Event-specific fields
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True  # JSONification
```

### CommentCreate & CommentResponse

```python
class CommentCreate(BaseModel):
    content: str
    
    class Config:
        example = {"content": "Great solution!"}

class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    author: UserSummary
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## 6. SQLAlchemy Models

### File: `backend/app/feed/models/post.py`

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class FeedPost(Base):
    __tablename__ = "posts"
    
    # Primary key & Foreign keys
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id", ondelete="SET NULL"), nullable=True)
    
    # Post content
    type = Column(String(20), default="post")  # post, article, event, repost
    content = Column(Text, nullable=False)
    title = Column(String(255), nullable=True)        # For articles & events
    image_url = Column(String(500), nullable=True)    # For articles & covers
    
    # Counters
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    repost_count = Column(Integer, default=0)
    
    # Optional enrichment
    tags = Column(JSON, default=[])  # ["#dp", "#tree"]
    code_snippet = Column(JSON, nullable=True)  # {"language": "python", "code": "..."}
    
    # Event-specific
    event_date = Column(DateTime, nullable=True)
    event_location = Column(String(255), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", cascade="save-update")
    likes = relationship("PostLike", cascade="all, delete-orphan")
    comments = relationship("Comment", cascade="all, delete-orphan", back_populates="post")
    
    # Indexes
    __table_args__ = (
        Index('idx_user_id', 'user_id'),
        Index('idx_created_at', 'created_at'),
        Index('idx_type', 'type'),
        Index('idx_problem_id', 'problem_id'),
    )

class PostLike(Base):
    __tablename__ = "post_likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Prevent duplicate likes
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='uq_post_user_like'),
        Index('idx_post_id', 'post_id'),
        Index('idx_user_id', 'user_id'),
    )

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post = relationship("FeedPost", back_populates="comments")
    author = relationship("User")
    
    __table_args__ = (
        Index('idx_post_id', 'post_id'),
        Index('idx_user_id', 'user_id'),
    )
```

### Creating a Post

```
┌──────────────────────────────────────┐
│ User clicks "Share Solution" button  │
└──────────────────────────┬───────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │ Frontend validation:     │
            │ • Content not empty      │
            │ • Valid problem link     │
            │ • Valid tags             │
            └──────────────┬───────────┘
                           │ Valid ✓
                           ▼
    ┌──────────────────────────────────────┐
    │ POST /feed/posts                     │
    │ + JWT token in header                │
    │ + JSON body with post data           │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ Backend Authentication:              │
    │ • Decode JWT → extract user_id       │
    │ • Check if user is active/not banned │
    └──────────────┬───────────────────────┘
                   │ ✓ Authenticated
                   ▼
    ┌──────────────────────────────────────┐
    │ Backend Validation:                  │
    │ • Content length > 10 chars          │
    │ • Problem exists (if linked)         │
    │ • Valid tags format                  │
    └──────────────┬───────────────────────┘
                   │ ✓ Valid
                   ▼
    ┌──────────────────────────────────────┐
    │ Database INSERT:                     │
    │ INSERT INTO posts (                  │
    │   user_id, problem_id, content,      │
    │   tags, type, created_at             │
    │ ) VALUES (...)                       │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ Database Response:                   │
    │ New post with id = 156               │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ Return 201 Created + post data       │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │ Frontend:                            │
    │ • Add new post to top of feed        │
    │ • Show success toast notification    │
    │ • Clear form                         │
    └──────────────────────────────────────┘
```

### Loading Feed

```
┌──────────────────────────────────┐
│ User visits Feed page            │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ GET /feed/posts                  │
│ ?sort=latest&page=1&limit=20     │
│ + JWT token                      │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│ Database Query (optimized):                              │
│                                                          │
│ SELECT p.*, u.username, u.avatar,                       │
│        COUNT(l.id) as like_count,                       │
│        COUNT(c.id) as comment_count,                    │
│        EXISTS(SELECT 1 FROM post_likes WHERE            │
│          post_id = p.id AND user_id = $1) as liked      │
│ FROM posts p                                            │
│ LEFT JOIN post_likes l ON p.id = l.post_id              │
│ LEFT JOIN comments c ON p.id = c.post_id                │
│ JOIN users u ON p.user_id = u.id                       │
│ LEFT JOIN problems pr ON p.problem_id = pr.id           │
│ WHERE p.created_at <= NOW()                             │
│ ORDER BY p.created_at DESC                              │
│ LIMIT 20 OFFSET 0                                       │
│                                                          │
│ ⏱️ Result: ~50-100ms (with proper indexes)              │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Return JSON array of posts       │
│ + pagination metadata            │
│ 200 OK                           │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Frontend:                        │
│ • Parse JSON                     │
│ • Map posts to <FeedPost> comps  │
│ • Render feed list               │
│ • Show pagination controls       │
└──────────────────────────────────┘
```

---

## 6. Technology Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| **Backend Framework** | FastAPI (Python) | ✓ Already in use, async-ready, auto docs |
| **Database** | PostgreSQL 15 | ✓ Powerful JSON support, reliability |
| **ORM** | SQLAlchemy 2.x | ✓ Consistent with existing codebase |
| **Authentication** | JWT (RS256) | ✓ Existing system, stateless, secure |
| **Caching** | Redis (optional) | For vote counts (hot data), trending cache |
| **Frontend** | React + Fetch API | ✓ Existing, native HTTP client |
| **Deployment** | Docker + Docker Compose | ✓ Containerized, consistent environment |

---

## 7. Implementation Timeline

### Phase 1: Core Feed (Week 1)
- ✅ Database schema (3 tables: posts, post_likes, comments)
- ✅ SQLAlchemy models
- ✅ CRUD routers (create, list, get, delete)
- ✅ Like system (toggle like/unlike)
- ✅ Comments system
- **Time**: ~30 hours
- **Deliverable**: Working feed with basic features

### Phase 2: Enhancements (Week 2)
- ✅ Post types (post, article, event, repost)
- ✅ Event-specific fields (event_date, event_location)
- ✅ Article image uploads
- ✅ Sorting (latest, top)
- ✅ Pagination optimization
- ✅ Frontend integration
- **Time**: ~25 hours
- **Deliverable**: Full-featured feed matching UI

### Phase 3: Polish & Scale (Week 3)
- ✅ Performance optimization (caching, DB indexing)
- ✅ Optional fields (tags, code_snippet, problem_id)
- ✅ Trending algorithm
- ✅ Moderation tools (flag, delete)
- **Time**: ~15 hours
- **Deliverable**: Production-ready system

**Total Estimated Time**: 70 hours (~2 weeks for one developer)

---

## 8. Security Considerations

| Risk | Mitigation |
|------|-----------|
| **Unauthorized access** | JWT auth middleware on all endpoints |
| **SQL injection** | SQLAlchemy query builder (parameterized) |
| **Like spam** | UNIQUE constraint prevents duplicate likes + rate limiting |
| **Spam posts** | Rate limit: 10 posts/hour per user |
| **Offensive content** | Content moderation queue + admin tools |
| **XSS injection** | Sanitize content + HTML escape on frontend |

---

## 9. Performance Targets

| Operation | Target | Method |
|-----------|--------|--------|
| Load feed (20 posts) | < 200ms | Optimized queries + indexes |
| Create post | < 100ms | Async insertion |
| Toggle like | < 50ms | Direct INSERT/DELETE |
| Add comment | < 100ms | Async insertion |

---

## 10. Integration Points with Existing System

```
┌────────────────────────────────────────────────────────────┐
│                   Existing Marevlo                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User Authentication (auth/routers/auth.py)             │
│     ├► Feed uses JWT token to identify users              │
│     └► Post.user_id = authenticated_user.id                │
│                                                              │
│  2. User Profiles (profile/models/profile.py)              │
│     ├► Display user name/avatar on posts                   │
│     └► Link to user profile from post author               │
│                                                              │
│  3. Problems (problems/models/problem.py)                  │
│     ├► Posts can link to problems (problem_id FK)          │
│     └► Show problem context when linked                    │
│                                                              │
│  4. Submissions (submissions/models/submission.py)         │
│     ├► Users can share solutions after submission          │
│     └► Link submission results in posts (Phase 2)          │
│                                                              │
│  5. Activity Log (core/activity_model.py)                  │
│     └► Log "user_posted", "user_liked", "user_commented"   │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## 11. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    docker-compose.yml                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  services:                                                   │
│    postgres:        (existing)          port 5432            │
│    backend:         (existing + new)    port 8000            │
│                     • Mounts new /feed router                │
│                     • New migrations for 3 tables            │
│    redis:           (existing)          port 6379            │
│    ide-api:         (existing)          port 4000            │
│    runner:          (existing)          port 4002            │
│                                                               │
│  volumes:                                                    │
│    postgres_data: (persists all data including feed posts)  │
│                                                               │
└──────────────────────────────────────────────────────────────┘

Command to deploy:
  $ docker-compose up --build

New files added:
  backend/app/feed/
    ├── models/
    │   ├── post.py          (120 lines)
    │   └── comment.py       (40 lines)
    ├── schemas/
    │   └── feed.py          (140 lines)
    └── routers/
        └── feed.py          (250 lines - all endpoints)

  backend/alembic/versions/
    └── <timestamp>_feed_tables.py  (150 lines - migrations)
```

---

## 12. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Feed load time** | < 200ms | Application Performance Monitor |
| **Post creation latency** | < 100ms | Backend logs |
| **User engagement** | 50% daily active | Analytics dashboard |
| **Avg posts per user/week** | 2-3 | Database query |
| **Avg likes per post** | 8-15 | Data analysis |
| **System uptime** | 99.9% | Monitoring tools |

---

## 13. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Database performance degrade | 🔴 High | Implement proper indexes + pagination |
| Spam/abuse content | 🟡 Medium | Rate limiting, content moderation tools |
| Like counter inconsistency | 🟡 Medium | ACID transactions, UNIQUE constraints |
| Data loss during migration | 🔴 High | Test migrations locally first, backup DB |

---

## 14. Architecture Diagram (Detailed)

```
                 ┌─────────────────────┐
                 │   React Frontend    │
                 │   (port 5173)       │
                 └──────────┬──────────┘
                            │ HTTP/REST
                            │ (with JWT)
            ┌───────────────▼───────────────┐
            │      FastAPI Backend          │
            │      (port 8000)              │
            │                               │
            │  ┌─────────────────────────┐ │
            │  │ JWT Middleware          │ │
            │  │ Validates all requests  │ │
            │  └──────────┬──────────────┘ │
            │             │                │
            │  ┌──────────▼──────────────┐ │
            │  │ /feed Router:           │ │
            │  │                         │ │
            │  │ • POST /posts       ..create
            │  │ • GET  /posts       ..list
            │  │ • GET  /posts/{id}  ..detail
            │  │ • DEL  /posts/{id}    ..delete
            │  │ • POST /posts/{id}/like  ..toggle like
            │  │ • POST /posts/{id}/comments
            │  │ • GET  /posts/{id}/comments
            │  └──────────┬──────────────┘ │
            │             │                │
            │  ┌──────────▼──────────────┐ │
            │  │ SQLAlchemy ORM :        │ │
            │  │ (Query builder)         │ │
            │  │  • Database session     │ │
            │  │  • CRUD operations      │ │
            │  └──────────┬──────────────┘ │
            └─────────────┼────────────────┘
                          │ SQL
            ┌─────────────▼──────────────┐
            │   PostgreSQL (port 5432)   │
            │                            │
            │ ┌──────────────────────┐  │
            │ │ posts (500K rows)    │  │
            │ ├──────────────────────┤  │
            │ │ post_likes (2.5M)    │  │
            │ ├──────────────────────┤  │
            │ │ comments (1M rows)   │  │
            │ └──────────────────────┘  │
            │                            │
            │ Indexes:                   │
            │ • idx_posts_user_id        │
            │ • idx_posts_created_at     │
            │ • idx_post_likes_post_id   │
            └────────────────────────────┘
```

---

## 15. Next Steps

### Immediate (Week 1):
1. ✅ Create database migration file (posts, post_likes, comments)
2. ✅ Implement Post & Comment models
3. ✅ Build feed.py router with 7 endpoints
4. ✅ Implement schemas (Pydantic)
5. ✅ Test with Postman/Insomnia

### Short-term (Week 2):
1. ✅ Frontend integration (replace local state with API calls)
2. ✅ Update Feed.jsx to use `/feed/posts` endpoints
3. ✅ Add event-specific UI (date & location fields)
4. ✅ Add comment display/posting UI
5. ✅ Test end-to-end

### Medium-term (Week 3):
1. ✅ Performance optimization (caching, indexing)
2. ✅ Add optional field support (tags, code_snippet, problem_id)
3. ✅ Trending algorithm (Phase 2)
4. ✅ Analytics dashboards (Phase 3)

---

**Document Prepared By**: AI Assistant  
**For Review By**: Engineering Management  
**Estimated Implementation Cost**: 70 developer hours (~2 weeks)  
**Expected ROI**: 40-60% increase in user engagement
