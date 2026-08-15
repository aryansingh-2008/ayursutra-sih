# AyurSutra — Quick Start

## 1. Backend

Open a terminal in `backend`:

```bash
npm install
npm run seed
npm run dev
```

Backend: `http://localhost:4000`

Health check: `http://localhost:4000/api/health`

## 2. Frontend

Open a second terminal in `frontend`:

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## 3. Demo login

Password for seeded accounts: `demo1234`

- Admin: `admin@ayursutra.demo`
- Doctor: `dr.mehta@ayursutra.demo`
- Doctor: `dr.sharma@ayursutra.demo`
- Therapist: `kavya.nair@ayursutra.demo`
- Therapist: `rohan.iyer@ayursutra.demo`
- Therapist: `meera.pillai@ayursutra.demo`
- Patient: `rahul.sharma@ayursutra.demo`
- Patient: `ananya.verma@ayursutra.demo`

## 4. SIH demo flow

1. Login as Dr. Mehta.
2. Open Rahul Sharma.
3. Create a treatment plan.
4. Generate the Smart Schedule.
5. Show the real scheduling conflict and alternatives.
6. Approve the draft schedule.
7. Return to the doctor dashboard and generate the **AyurSutra Assistant** brief.
8. Switch to a therapist account and complete a session.
9. Re-open Analytics to show the updated operational metrics.

> The Assistant is decision-support only. It summarizes existing operational data and does not diagnose or prescribe.
