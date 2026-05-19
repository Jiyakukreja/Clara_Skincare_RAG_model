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
- OpenAI API for optional local FAISS embeddings
- LangGraph
- LangChain
- FAISS
- OpenAI Embeddings

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

Optional: add `OPENAI_API_KEY` only if you want FAISS semantic embeddings. Without it, the app still works with keyword retrieval over the Clinikally-only catalog.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend at [http://localhost:3000](http://localhost:3000).

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
- [x] Backend recommendation smoke test passed without an API key using fallback retrieval
- [x] Frontend production build passed
- [x] Browser smoke test passed at `http://localhost:3000`
- [x] Gemini embedding check passed with 768 dimensions
- [x] Backend chat smoke test returns Clinikally-only URLs

## Development Notes

- The MVP keeps the code modular and beginner-friendly.
- The backend uses async routes so it can grow into more realistic AI workflows.
- The frontend starts with a clean chat interface and later adds product cards and routine sections.
- Gemini-powered recommendation analysis activates when `GEMINI_API_KEY` is set.
- OpenAI-powered embeddings activate only when `OPENAI_API_KEY` is set. Without it, the backend still demos retrieval using keyword matching.
