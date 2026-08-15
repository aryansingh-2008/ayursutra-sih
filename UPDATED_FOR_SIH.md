# AyurSutra — SIH Final Prototype Scope

## Core pitch
**AI-assisted Panchakarma care coordination + explainable treatment decision support + conflict-aware smart scheduling.**

## Implemented modules
- Role-based Admin / Doctor / Therapist / Patient access
- Patient 360 profile and treatment journey
- Admin patient CRUD with assigned-doctor reassignment
- Staff management for Admin / Doctor / Therapist accounts
- Treatment plans with selectable treating doctor
- Smart scheduler with therapist, room and patient conflict checks
- Doctor approval before a schedule becomes active
- Patient schedule and treatment portal
- Operational analytics
- Explainable AI Clinical Copilot prototype
  - therapy ranking from configured clinic therapy catalog
  - transparent reasons / fit signal
  - safety review prompts
  - session adherence / progress insight
- Ayurvedic Protocol Library with configurable therapy catalog and reference templates
- Existing operational assistant brief
- Notifications, feedback, progress records and audit log foundations

## AI safety boundary
The AI layer is deliberately positioned as **clinical decision support**, not autonomous diagnosis or prescribing. It ranks configured therapies from clinician-entered context and existing operational data. Every recommendation carries a review disclaimer and the treating professional remains responsible for the final plan.

## Demo flow for SIH
1. Admin logs in and manages staff.
2. Admin opens Patients and changes a patient's assigned doctor.
3. Doctor opens Patient 360.
4. Doctor opens AI Copilot and enters assessment context.
5. Copilot shows ranked options, reasons and safety review prompts.
6. Doctor reviews/edits a Treatment Plan.
7. Smart Scheduler generates a conflict-aware draft.
8. Doctor approves the schedule.
9. Patient sees the resulting sessions.
10. Progress and operational analytics show the outcome/adherence picture.

## Run
### Backend
```powershell
cd backend
npm install
npm run seed
npm run dev
```

### Frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```

Demo admin:
- Email: `admin@ayursutra.demo`
- Password: `demo1234`

The seed command resets demo data intentionally so the SIH walkthrough starts from a known state.
