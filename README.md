# AyurSutra — Panchakarma Patient Management & Therapy Scheduling Platform

Built for **SIH25023: AyurSutra — Panchakarma Patient Management and Therapy Scheduling Software**.

A Panchakarma-focused patient management and intelligent therapy scheduling platform — not a generic
hospital management system.

---

## 1. Problem statement

Panchakarma clinics coordinate multiple constrained resources — doctors, therapists, treatment rooms, and
multi-day treatment plans — largely on paper. This causes scheduling conflicts, missed sessions, and no
single source of truth for a patient's treatment journey.

## 2. Problem understanding

The core difficulty isn't storing patient records — it's **resolving many simultaneous scheduling
constraints** (therapist availability, room availability, patient double-booking, therapy duration,
treatment-plan sequencing) every time a session is booked, and doing it fast enough to use live in a clinic.

## 3. Proposed solution

A role-based web app (Admin / Doctor / Therapist / Patient) built around one core engine — the **Smart
Scheduler** — that:

1. Takes a treatment plan (a patient + a sequence of therapies + a date range).
2. For each session, checks therapist availability, room availability, and the patient's existing
   appointments simultaneously.
3. If the preferred slot is unavailable, it explains why and proposes up to three concrete alternative
   slots (time, therapist, room).
4. Produces a full multi-day **draft** schedule for doctor review — nothing is booked until the doctor
   approves it.

Everything else (dashboards, calendar, analytics, notifications) is built around that engine and the
patient's treatment journey (Registered → Assessment → Treatment Plan → Therapy Sessions → Progress →
Follow-up).

## 4. Features implemented in this prototype

- Role-based auth (JWT + bcrypt) for Admin, Doctor, Therapist, Patient
- Patient registration, profile, and treatment-journey timeline
- Treatment plan builder (select therapies, sessions, frequency, duration)
- **Smart Scheduler**: conflict detection + alternative-slot suggestion + full draft generation + approval
- Therapist "Today's Sessions" dashboard with Complete / Mark Missed actions and session notes
- Patient dashboard: next therapy, upcoming schedule, therapy history
- Weekly calendar view (Day/Week-style grid) color-coded by session status
- Admin/Doctor analytics: sessions/day, completed vs. missed vs. rescheduled, therapist workload, room
  utilization
- In-app notifications table (seeded with a sample scheduling-conflict + missed-session alert)
- **AyurSutra Assistant**: explainable, local care-coordination briefs built from scheduling/progress data (no diagnosis or prescribing)
- Backend health/root endpoints for easier deployment and demo verification
- Useful empty states everywhere ("No appointments today", "No treatment plan has been created yet", etc.)
- Realistic demo data with an **intentionally pre-built conflict** so the Smart Scheduler demo (see below)
  shows a real conflict-and-resolve flow, not a scripted one

### Not yet built (see "Future scope")

Full CRUD admin screens for doctors/therapists/rooms/therapy library, drag-and-drop calendar editing,
email/SMS notification delivery, the AI Assistant module (progress summaries / reminder personalization),
and global search — the architecture supports all of these; they weren't implemented in this prototype pass.

## 5. Architecture

```
Frontend (React + TS + Tailwind)  →  Backend REST API (Express + TS)  →  SQLite (dev) / PostgreSQL (prod)
```

- Frontend talks only to `/api/*`, proxied to the backend in dev (see `frontend/vite.config.ts`).
- Backend is layered: `routes/` (HTTP + validation) → `services/scheduler.ts` (the scheduling engine, pure
  functions over the DB) → `db/` (schema + connection).
- The scheduler is intentionally decoupled from Express so it can be unit-tested or reused (e.g. by a
  future AI service) without going through HTTP.

## 6. Tech stack

| Layer      | Choice                                              |
|------------|------------------------------------------------------|
| Frontend   | React 19 + TypeScript + Vite + Tailwind CSS v4 + React Router + Recharts + lucide-react |
| Backend    | Node.js + Express + TypeScript                       |
| Database   | SQLite via `better-sqlite3` (prototype). Schema is written in portable SQL and maps directly to PostgreSQL — swap the `db/index.ts` connection layer to migrate. |
| Auth       | JWT (`jsonwebtoken`) + `bcryptjs`                     |
| Charts     | Recharts                                              |

> The master spec recommended PostgreSQL. This prototype uses SQLite (same schema, zero external services
> to install) so it runs anywhere with just `npm install`. The `backend/src/db/schema.sql` file is standard
> SQL and needs only minor type tweaks (`TEXT`→`UUID`/`TIMESTAMP`, `AUTOINCREMENT` if used) to run on
> Postgres directly.

## 7. Database design

See `backend/src/db/schema.sql` for the full schema: `users`, `doctors`, `therapists`, `patients`,
`therapies`, `treatment_plans`, `treatment_plan_therapies`, `therapist_availability`, `appointments`,
`rooms`, `progress_records`, `feedback`, `notifications`, `audit_logs` — normalized, with foreign keys and
indexes on the columns the scheduler queries most (`appointments.session_date`,
`appointments(therapist_id, session_date)`, `appointments(room_id, session_date)`).

## 8. AI functionality

Per the spec, no AI diagnoses or prescribes anything in this prototype. The architecture reserves a slot
for an **AyurSutra AI Assistant** module (schedule-optimization suggestions, patient progress summaries,
reminder personalization, admin insights) as a clearly-labeled, doctor-reviewed layer on top of the
existing scheduler/analytics data — not implemented in this pass. See "Future scope."

## 9. Installation

Requires Node.js 18+.

```bash
# Backend
cd backend
npm install
cp .env.example .env   # edit JWT_SECRET for anything beyond local demo use
npm run seed            # creates ayursutra.db and populates demo data
npm run dev              # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxies /api to :4000)
```

## 10. Environment variables

`backend/.env`:

```
PORT=4000
JWT_SECRET=change-this-to-a-long-random-string-in-production
```

## 11. Running instructions

1. Start the backend first (`npm run dev` in `backend/`) — it seeds/creates `ayursutra.db` on first run if
   you've run `npm run seed`.
2. Start the frontend (`npm run dev` in `frontend/`).
3. Open `http://localhost:5173`.
4. Re-seed anytime with `npm run seed` in `backend/` — it's destructive and idempotent (wipes and
   recreates all demo data), useful for resetting before a live demo.

## 12. Demo credentials

All passwords: `demo1234`

| Role      | Email                          |
|-----------|----------------------------------|
| Admin     | admin@ayursutra.demo             |
| Doctor    | dr.mehta@ayursutra.demo          |
| Doctor    | dr.sharma@ayursutra.demo         |
| Patient   | rahul.sharma@ayursutra.demo      |
| Patient   | ananya.verma@ayursutra.demo      |
| Patient   | arjun.singh@ayursutra.demo       |
| Patient   | priya.gupta@ayursutra.demo       |

Therapist accounts exist too — see the login screen's "demo accounts" panel, or query
`GET /api/therapists` after logging in as a doctor.

### Suggested demo flow (matches the SIH walkthrough)

1. Log in as **Dr. Mehta**.
2. Open patient **Rahul Sharma** → "Create treatment plan."
3. Pick therapies (e.g. Abhyanga), set session counts, save.
4. On the Smart Scheduler screen, click **Generate Smart Schedule**.
   - Ananya Verma's existing 10:00 AM booking with Therapist A / Room 2 today means the scheduler has to
     route around a real conflict — you'll see the conflict card explaining why, with the alternative slots
     it found, and the draft schedule that already reflects the resolution.
5. Click **Approve schedule** — appointments are created.
6. Log out, log in as **Rahul's** account (well — as any seeded patient, e.g. ananya.verma@ayursutra.demo)
   to see the live patient dashboard.
7. Log in as a therapist to see **Today's Sessions**, and mark one **Completed**.
8. Back in the doctor's Analytics tab, the completed/missed counts reflect the change.

## 13. Updated demo additions

- Open `http://localhost:4000/` to verify the backend is alive; `/api/health` returns a JSON health check.
- From the Doctor dashboard, select a patient and click **Generate brief** in AyurSutra Assistant.
- The brief highlights completion rate, next session, missed sessions, draft plans, and recent operational exceptions.
- The Login screen includes quick-fill demo accounts for doctors, patients, and therapists.

## 14. Future scope

- AI Assistant module: progress summaries, personalized reminders, admin insights — all clearly labeled as
  AI-generated and requiring professional confirmation, per the original spec
- Admin CRUD for therapy library, rooms, and therapist weekly availability
- Email/SMS/push notification delivery (the `notifications` table and UI are ready; only the delivery
  channel is missing)
- Drag-and-drop schedule editing directly on the calendar
- Global search across patients/doctors/therapies/dates
- Audit log viewer for admins
- Migration from SQLite to PostgreSQL for multi-instance deployment

---

*This is a decision-support and scheduling tool. It assists doctors and therapists and does not replace
clinical judgment. No medical indications, contraindications, or dosages are encoded in this prototype.*
