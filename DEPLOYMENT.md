# AyurSutra Deployment Guide

## Architecture

- Frontend: Vercel (Vite SPA)
- Backend: Render Web Service (Node + Express)
- Database: SQLite for SIH demo/prototype

## 1. GitHub

Push the repository root containing `frontend/` and `backend/`. Do not commit `.env` or `*.db`.

## 2. Backend on Render

Use the repository's `render.yaml` or create a Web Service manually:

- Root Directory: `backend`
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check: `/api/health`

Set environment variables:

- `JWT_SECRET`: a long random secret
- `CORS_ORIGIN`: your Vercel URL (or `*` for a temporary demo)
- `LLM_API_KEY`: optional; leave empty to use the local AI fallback
- `LLM_BASE_URL`: optional
- `LLM_MODEL`: optional
- `LLM_TIMEOUT_MS`: `8000`

After deploy, verify `https://YOUR-BACKEND.onrender.com/api/health`.

### Demo database

The project uses SQLite. Render Free services have an ephemeral filesystem, so SQLite data is not durable across restarts/redeploys. For an SIH demo this is acceptable only if you are prepared to reseed the demo database. For durable production data, migrate to PostgreSQL or use a paid persistent disk.

The seed script intentionally resets demo data, so **do not run it automatically on every server start**. Run `npm run seed` only when you intentionally want a fresh demo dataset.

## 3. Frontend on Vercel

Create a Vercel project with:

- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set:

`VITE_API_URL=https://YOUR-BACKEND.onrender.com/api`

The included `frontend/vercel.json` enables SPA deep links such as `/login`, `/doctor`, and `/patient`.

## 4. Local development

Frontend keeps using `/api`; Vite proxies it to `http://localhost:4000`. No `VITE_API_URL` is required locally.

Backend:

```bash
cd backend
npm install
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## 5. Important

The AI Copilot is optional. If the external LLM is unavailable, the built-in fallback should keep the core application usable.
