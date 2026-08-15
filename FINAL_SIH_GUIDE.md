# AyurSutra — Final SIH Build

## Final product scope
- Patient 360 + CRUD + doctor assignment
- Staff management (Admin / Doctor / Therapist)
- Treatment plans + therapy/session selection
- Smart scheduler with patient/therapist/room conflict checks and alternatives
- Doctor approval workflow
- AI Clinical Copilot with explainable therapy ranking and progress insights
- Optional live LLM explanation layer (server-side, doctor-reviewed)
- Ayurvedic protocol library
- Role-based dashboards, analytics, notifications foundations

## Run locally
Open this folder in VS Code:
`ayursutra`

Backend terminal:
```powershell
cd backend
npm install
npm run seed
npm run dev
```

Frontend terminal:
```powershell
cd frontend
npm install
npm run dev
```

Use the Local URL printed by Vite. Demo admin:
`admin@ayursutra.demo` / `demo1234`

## Optional live LLM
The app works without an LLM key using the built-in explainable rules engine. To turn on live LLM explanations, copy `.env.example` to `.env` and set:
- `LLM_API_KEY`
- `LLM_BASE_URL` (defaults to an OpenAI-compatible `/v1` endpoint)
- `LLM_MODEL`

The key stays on the backend. The frontend never receives it. If the LLM is unavailable, the system automatically falls back to the deterministic rules engine.

## SIH demo flow
Landing → Login → Admin/Doctor → Patient 360 → AI Copilot → Treatment Plan → Smart Scheduler → Conflict/Alternative → Doctor Approval → Patient Schedule → Progress/Analytics.

## Important safety positioning
AI is decision support only. It must not be presented as diagnosis, autonomous prescribing, or a replacement for a qualified clinician. Every recommendation is reviewable and approval remains with the clinician.
