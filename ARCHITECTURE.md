# Marevlo — Architecture Overview

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router 6, CodeMirror, Firebase SDK |
| **Backend** | FastAPI (Python), SQLAlchemy + asyncpg, Alembic, Pydantic |
| **Database** | PostgreSQL 15 |
| **Cache / PubSub** | Redis 7 (session blacklisting, WebSocket chat sync) |
| **Auth** | Firebase (Google sign-in) + local email/password with JWT + OTP password reset |
| **IDE Services** | Custom Node/TS runner (sandboxed C++/Java/Python execution) + Jupyter kernel proxy |
| **Storage** | Google Cloud Storage (GCS) for file uploads |
| **Deployment** | Frontend on Vercel, backend + services via Docker Compose |

---

## System Architecture

```
Browser (React + Firebase Auth)
    │
    ├── REST / WebSocket ──→ FastAPI backend (:8000)
    │                            ├── PostgreSQL (:5432) — users, sessions, posts, chats, problems
    │                            ├── Redis (:6379) — token blacklist, chat pub/sub
    │                            ├── GCS — file/image uploads
    │                            └── IDE API (:4000) ──→ Jupyter (:8888) — notebook kernels
    │
    └── Code Execution ──→ Runner (:4002) — sandboxed C++/Java/Python execution
```

---

## Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| `postgres` | 5432 | Primary database (initialized from `postgres/init.sql`) |
| `backend` | 8000 | FastAPI application |
| `ide-api` | 4000 | IDE API server (Jupyter kernel proxy with warm kernel pool) |
| `runner` | 4002 | Sandboxed code runner (Python pool, compile cache, concurrency throttle) |
| `jupyter` | 8888 | Jupyter notebook server backing the IDE API |
| `redis` | 6379 | Session/token blacklist + real-time chat pub/sub |

---

## API Endpoints

| Prefix | Module | Purpose |
|--------|--------|---------|
| `/auth` | `auth.routers.auth` | Login, register, Google sign-in, forgot/reset password, token refresh |
| `/execute` | `submissions.routers.run` | Code execution (proxies to IDE runner service) |
| `/chat` | `chat.routers.chat` + `chat.routers.ws` | Direct messaging (REST + WebSocket real-time) |
| `/feed` | `feed.routers.feed` | Social feed — posts, likes, comments, reposts |
| `/profile` | `profile.routers.me` | User profile and achievements |

---

## Course Content Architecture

### Storage: Static HTML Files (No Database)

Courses are stored as **self-contained HTML files** in the frontend's public directory. There is no backend API or database table for course content.

```
frontend/public/cources/
├── clus/                        # Clustering (part_0.html .. part_11.html)
├── Data_Science/
│   ├── python.html
│   ├── stats-prob/
│   ├── machine-learning/        # module.1.html .. module.3.html
│   ├── DL/                      # Deep Learning (13 modules)
│   └── pytorch/                 # PyTorch (12 modules)
├── generative-ai/
│   ├── RAG/                     # 15 modules + sub-trees (Ingestion, OCR, DLA, Quantisation)
│   ├── Multi-modal-rag/         # 13 modules + Evaluation sub-tree
│   ├── mcp/
│   └── vectorless-rag/
└── LangGraph/                   # module1.html .. module8.html
```

### Key Frontend Structures

Three structures in the frontend control the course system:

| Structure | File | Line | Purpose |
|-----------|------|------|---------|
| `COURSE_TREE` | `src/pages/Courses.jsx` | ~L14 | Recursive tree defining the browsable card/folder hierarchy |
| `COURSE_HTML_MAP` | `src/pages/CourseContent.jsx` | ~L173 | Maps each leaf course ID → static HTML file path (~130 entries) |
| `IFRAME_COURSES` | `src/pages/CourseContent.jsx` | ~L325 | Set of IDs rendered as `<iframe>` (self-contained HTML with own styles) |
| `COURSE_CONFIGS` | `src/pages/CourseContent.jsx` | ~L443 | Optional hero banner metadata and sidebar lesson definitions |

### Rendering Flow

```
/courses                         → Courses.jsx renders COURSE_TREE as navigable cards
  └─ click leaf card             → navigates to /course/:id
      └─ CourseContent.jsx
          ├─ htmlFile = COURSE_HTML_MAP[id]
          ├─ fetch(htmlFile)                        ← static file from /public/cources/
          │
          ├─ IF id in IFRAME_COURSES:
          │    └─ Render as <iframe src={htmlFile}>  (preserves original styles/scripts)
          │
          └─ ELSE:
               ├─ processHtml(rawHTML)              → normalizes headings, extracts TOC
               └─ html-react-parser renders result
                    ├─ <python>/<sql>/<code> tags   → InteractiveCodeBlock (runnable)
                    └─ <img> tags                   → ZoomableImage (click-to-zoom overlay)
```

### Adding a New Course

1. Place HTML file in `frontend/public/cources/`
2. Add entry to `COURSE_HTML_MAP` in `CourseContent.jsx` (~L173)
3. If self-contained HTML (has own `<style>`/`<head>`), add ID to `IFRAME_COURSES` (~L325)
4. Add card definition to `COURSE_TREE` in `Courses.jsx` (~L14)

---

## DSA Problems Architecture

### Storage: JSON Files (Frontend) + PostgreSQL (Backend)

Problem **content** (descriptions, examples, approaches) is stored as JSON files bundled into the frontend at build time. The **database** stores problem metadata, test cases, and user submissions.

#### JSON Files — Problem Content

```
frontend/src/assets/
├── ARRAYS/                      # ~100 JSON files
├── Binary trees/
├── Dynamic Programming/
├── Graph/
├── Linked list/
├── Maths/
├── Recursion/
├── Searching and Sorting/
├── Stacks Queues and Heaps/
├── String/
└── Trie/
```

Each JSON file follows this structure:

```json
{
  "id": "find-maximum-element-in-array",
  "title": "Find maximum element in array",
  "category": "arrays",
  "difficulty": "Easy",
  "tags": ["Arrays", "Number Theory"],
  "description": "Given an array of integers, return the maximum element.",
  "constraints": ["..."],
  "examples": [
    { "input": "[3, 1, 4, 1, 5, 9]", "output": "9", "explanation": "..." }
  ],
  "approaches": [
    {
      "id": "brute-force",
      "name": "Brute Force O(n²)",
      "timeComplexity": "O(n²)",
      "spaceComplexity": "O(1)",
      "ladders": [
        { "level": 0, "title": "...", "explanation": "...", "examples": [...] }
      ]
    }
  ]
}
```

#### PostgreSQL — Test Cases & Submissions

```sql
-- Problem metadata
CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test cases for code validation
CREATE TABLE problem_testcases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN DEFAULT false
);

-- User submissions
CREATE TABLE problem_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    language VARCHAR(50),
    status VARCHAR(50),
    test_cases_passed INTEGER,
    execution_time FLOAT,
    memory_used FLOAT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Problem Loader

`frontend/src/utils/topicsLoader.js` uses Vite's `import.meta.glob` to eagerly import all JSON files at build time:

```js
const modules = import.meta.glob('../assets/**/*.json', { eager: true });
```

Problems are grouped by folder name into topics with display metadata.

### Rendering & Execution Flow

```
Build time:
  topicsLoader.js bundles all JSON from src/assets/ via import.meta.glob

Runtime:
  Problems page → lists topics with problem cards (from bundled JSON)
    └─ click problem → ProblemPanel renders description, examples, approaches
        └─ user writes code in CodeMirror editor
            └─ POST /execute/run → FastAPI backend
                └─ proxies to Runner service (:4002)
                    └─ sandboxed execution (C++/Java/Python)
                        └─ result returned + ProblemSubmission saved to PostgreSQL
```

---

## Key Features Summary

| Feature | Description |
|---------|-------------|
| **Courses** | 130+ interactive HTML lessons across Generative AI, Data Science, ML/DL, PyTorch, LangGraph |
| **DSA Problems** | 100+ problems across 11 topics with multiple approaches, complexity analysis, and step-by-step traces |
| **Online IDE** | In-browser code editor (CodeMirror) with C++, Java, Python execution via sandboxed runner |
| **Interactive Code Blocks** | Runnable Python/SQL snippets embedded directly in course content |
| **Social Feed** | Posts, likes, comments, reposts with pagination |
| **Real-time Chat** | WebSocket-based direct messaging with Redis pub/sub for multi-instance sync |
| **Auth** | Dual auth: Google sign-in (Firebase) + email/password (JWT) with OTP password reset |
| **User Profiles** | Profile pages with achievements tracking |

---

## Environment Variables

### Frontend (`frontend/.env`)
- `VITE_API_URL` — Backend base URL (e.g. `http://localhost:8000`)
- `VITE_RUNNER_URL` — IDE runner base URL (e.g. `http://localhost:4002`)

### Backend
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Email/OTP configuration
- Firebase Admin credentials for Google auth

---

## Project Structure

```
Marevlo/
├── frontend/                    # React 19 + Vite SPA
│   ├── public/cources/          # Static HTML course files
│   ├── public/problems/         # Legacy HTM problem files (unused)
│   └── src/
│       ├── assets/              # DSA problem JSON files (bundled at build)
│       ├── components/          # Reusable UI components
│       ├── context/             # React context providers
│       ├── pages/               # Route pages (Courses, CourseContent, Problems, etc.)
│       └── utils/               # Helpers (topicsLoader, etc.)
│
├── backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── auth/                # Authentication (Firebase + JWT)
│   │   ├── chat/                # Real-time messaging (WebSocket + Redis)
│   │   ├── core/                # Config, database, dependencies
│   │   ├── courses/             # (empty — courses are frontend-only)
│   │   ├── feed/                # Social feed
│   │   ├── problems/            # Problem models
│   │   ├── profile/             # User profiles
│   │   └── submissions/         # Code execution & submission logging
│   └── alembic/                 # Database migrations
│
├── ide-services-optimized/      # IDE API + code runner (Node/TypeScript)
│   ├── api-server/              # Jupyter kernel proxy
│   └── runner/                  # Sandboxed code execution
│
├── runner-images/               # Docker images for sandboxed execution
│   ├── cpp/
│   └── java/
│
├── postgres/
│   └── init.sql                 # Database schema initialization
│
└── docker-compose.yml           # All services orchestration
```
