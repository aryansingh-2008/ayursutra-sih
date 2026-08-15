# AyurSutra Patient CRUD Update

This update adds admin patient management:
- Add patient
- Search/filter patients
- View patient summary
- Edit patient profile/status
- Delete patient with dependent clinical records cleaned up in a SQLite transaction

## Files changed
- `backend/src/routes/patients.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/pages/admin/AdminPatients.tsx`

## Run
Start backend and frontend as before. No database migration is required because the existing schema already supports these fields.

For the first run after replacing the files:

```powershell
cd backend
npm install
npm run dev
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

## Staff management update
- Admins can add, edit and remove administrator/doctor/therapist accounts.
- Role-specific doctor/therapist profiles are created automatically.
- Doctor selection is available while creating a treatment plan.
- Staff endpoints are protected by admin authentication and write audit logs.
