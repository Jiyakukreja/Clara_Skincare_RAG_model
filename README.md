# AI Skincare Recommendation Platform

Mini MVP inspired by Clinikally's Clara AI system. This project combines a Next.js chat experience with a FastAPI backend, Gemini-powered recommendation analysis, FAISS retrieval, and a simple LangGraph multi-agent workflow.

## Features Checklist

- [x] Clean monorepo structure with `frontend/` and `backend/`
- [x] Professional README with setup and progress tracking
- [x] FastAPI backend scaffold
- [x] Next.js App Router frontend scaffold
- [x] Tailwind CSS setup
- [x] Gemini recommendation analysis integration
- [x] Clinikally-site-only skincare product dataset
- [x] FAISS RAG product retrieval
- [x] LangGraph multi-agent recommendation flow
- [x] Ingredient safety checker
- [x] Polished product recommendation UI

## Architecture Overview

```text
User
  |
  v
Next.js Frontend
  |
  v
FastAPI Backend
  |
  +--> Gemini Analysis Model
  +--> LangGraph Agent Flow
  +--> FAISS Product Retriever
  +--> Database URL Ready Config
  +--> Ingredient Safety Checker
```

## Tech Stack

**Frontend**

- Next.js App Router
- TypeScript
- Tailwind CSS

**Backend**

- FastAPI
- Python
- AsyncIO
- Uvicorn

**AI Stack**

- Gemini API
- Gemini API for chat generation and embeddings
- LangGraph
- LangChain
- FAISS
- Gemini Embeddings

## Setup Instructions

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Add your Gemini API key and database URL to `backend/.env`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=your_database_url_here
```

The app is Gemini-only. `GEMINI_API_KEY` is required for both generation and RAG embeddings; failures return an API error instead of local fallback text.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at [http://localhost:3000](http://localhost:3000).

### 3. Run both services together

Clara needs **two terminals**:

```bash
# Terminal 1 — backend (port 8000)
cd backend
.venv\Scripts\activate   # macOS/Linux: source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend (port 3000)
cd frontend
npm run dev
```

Confirm the backend is up:

```bash
curl http://127.0.0.1:8000/health
```

You should see `{"status":"ok"}`.

### 4. Deploy frontend (Vercel) + backend

1. Deploy the FastAPI backend (Render, Railway, Azure Container Apps, etc.) and note the public `/chat` URL.
2. In Vercel → Project → Settings → Environment Variables, set:
   - `BACKEND_URL` = `https://your-api-host.example.com/chat`
3. Redeploy the frontend.

Optional: copy `frontend/.env.local.example` to `frontend/.env.local` for local overrides.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Chat says backend unreachable | Backend not running on port 8000 | Start `uvicorn` (see above) |
| Chat says Gemini failed / 502 | Missing or invalid `GEMINI_API_KEY` | Set a real key in `backend/.env` |
| Vercel chat returns 503 | `BACKEND_URL` not set | Add deployed FastAPI `/chat` URL in Vercel env |
| Next.js “500: This page couldn’t load” | Server crash or proxy misconfiguration | Start backend, check terminal logs, reload |
| Follow-up questions fail after profile works | Backend stopped or API key quota exceeded | Restart backend and verify Gemini quota |

## Folder Structure

```text
AI_Skincare/
  README.md
  backend/
    .env.example
    requirements.txt
    app/
      __init__.py
      main.py
      api/
      core/
      models/
      services/
    data/
      products.json
    rag/
  frontend/
    package.json
    next.config.ts
    tsconfig.json
    postcss.config.mjs
    tailwind.config.ts
    src/
      app/
      components/
      lib/
      types/
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Backend health check |
| `POST` | `/chat` | AI skincare chat endpoint with answer, product recommendations, safety notes, and routines |

### Example Chat Request

```json
{
  "message": "I have oily acne-prone sensitive skin and use benzoyl peroxide."
}
```

### Example Chat Response Shape

```json
{
  "answer": "Personalized skincare guidance...",
  "products": [],
  "safety_warnings": [],
  "morning_routine": [],
  "night_routine": []
}
```

## Screenshots

Screenshots will be added after the UI is polished.

## Product Catalog Policy

The recommender is restricted to products listed on Clinikally. The local dataset in `backend/data/products.json` includes 25 Clinikally-site product listings with product URLs and INR prices, so the frontend should only show Clinikally-site product cards.

## Vector DB Recommendation

Current MVP: local FAISS is best because it is simple, free, and works offline.

Recommended next step: Pinecone is the best hosted vector DB choice for an internship-ready demo because setup is fast, deployment is clean, and it avoids running vector infrastructure yourself. If you prefer open-source/self-hosted, use Qdrant.

For the current Gemini embedding setup, create the Pinecone index as:

- Index name: `clinikally-products`
- Dimension: `768`
- Metric: `cosine`
- Namespace used by the app: `products`

When `VECTOR_DB_PROVIDER=pinecone`, the backend will use Pinecone for retrieval. If the Pinecone index is empty, the backend will embed and upsert the local Clinikally catalog automatically on the first search.

## How To Check Setup

From `backend/`, verify env alignment without printing secrets:

```bash
.venv\Scripts\python.exe -c "from app.core.config import settings; print({'provider': settings.vector_db_provider, 'pinecone_key_loaded': bool(settings.pinecone_api_key), 'index': settings.pinecone_index_name, 'namespace': settings.pinecone_namespace, 'embedding_model': settings.embedding_model, 'embedding_dimension': settings.embedding_dimension, 'database_url_loaded': bool(settings.database_url)})"
```

Verify Gemini embeddings:

```bash
.venv\Scripts\python.exe -c "import asyncio; from app.services.embedding_service import embed_text; v=asyncio.run(embed_text('oily acne prone sunscreen')); print(len(v))"
```

Run backend smoke test:

```bash
.venv\Scripts\python.exe -c "import asyncio; from app.services.chat_service import generate_chat_response; r=asyncio.run(generate_chat_response('I have oily acne-prone skin and need Clinikally sunscreen.')); print([p.name for p in r.products])"
```

Run frontend build:

```bash
cd frontend
npm run build
```

## Progress Tracker

- [x] Phase 1: Project structure created
- [x] Phase 1: README initialized
- [x] Phase 1: Backend scaffold created
- [x] Phase 1: Frontend scaffold created
- [x] Phase 2: Basic AI chat
- [x] Phase 3: Product dataset
- [x] Phase 4: FAISS RAG
- [x] Phase 5: LangGraph agents
- [x] Phase 6: Ingredient safety checker
- [x] Phase 7: Frontend polish
- [x] Added Gemini env/config for analysis
- [x] Added database URL env/config
- [x] Restricted recommendations to Clinikally-site-only catalog
- [x] Wired Pinecone provider path with Gemini embeddings

## Verification

- [x] Backend dependencies installed in `backend/.venv`
- [x] Frontend dependencies installed in `frontend/node_modules`
- [x] Product dataset validates as JSON and contains 25 Clinikally-site-only products
- [x] Backend Python compile check passed
- [x] Backend recommendation path requires a live Gemini API response
- [x] Frontend production build passed
- [x] Browser smoke test passed at `http://localhost:3000`
- [x] Gemini embedding check passed with 768 dimensions
- [x] Backend chat smoke test returns Clinikally-only URLs

## Development Notes

- The MVP keeps the code modular and beginner-friendly.
- The backend uses async routes so it can grow into more realistic AI workflows.
- The frontend starts with a clean chat interface and later adds product cards and routine sections.
- Gemini-powered recommendation analysis activates when `GEMINI_API_KEY` is set.
- Gemini-powered embeddings are used for FAISS and Pinecone retrieval. No keyword fallback is returned as an AI answer.
