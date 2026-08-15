import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function baseQuery() {
  return `SELECT a.*, th.name as therapy_name, pu.name as patient_name, p.id as patient_id,
                  tu.name as therapist_name, r.name as room_name, du.name as doctor_name
           FROM appointments a
           JOIN therapies th ON th.id = a.therapy_id
           JOIN patients p ON p.id = a.patient_id
           JOIN users pu ON pu.id = p.user_id
           JOIN therapists t ON t.id = a.therapist_id
           JOIN users tu ON tu.id = t.user_id
           JOIN rooms r ON r.id = a.room_id
           LEFT JOIN doctors d ON d.id = a.doctor_id
           LEFT JOIN users du ON du.id = d.user_id`;
}

// GET /api/appointments?date=YYYY-MM-DD&therapistId=&patientId=&from=&to=
router.get("/", (req: AuthedRequest, res) => {
  const { date, therapistId, patientId, from, to, status } = req.query as Record<string, string>;
  const clauses: string[] = [];
  const params: any[] = [];

  if (req.user!.role === "therapist") {
    const t = db.prepare(`SELECT id FROM therapists WHERE user_id = ?`).get(req.user!.id) as any;
    if (t) {
      clauses.push("a.therapist_id = ?");
      params.push(t.id);
    }
  }
  if (req.user!.role === "patient") {
    const p = db.prepare(`SELECT id FROM patients WHERE user_id = ?`).get(req.user!.id) as any;
    if (p) {
      clauses.push("a.patient_id = ?");
      params.push(p.id);
    }
  }
  if (date) {
    clauses.push("a.session_date = ?");
    params.push(date);
  }
  if (from && to) {
    clauses.push("a.session_date BETWEEN ? AND ?");
    params.push(from, to);
  }
  if (therapistId) {
    clauses.push("a.therapist_id = ?");
    params.push(therapistId);
  }
  if (patientId) {
    clauses.push("a.patient_id = ?");
    params.push(patientId);
  }
  if (status) {
    clauses.push("a.status = ?");
    params.push(status);
  }

  const where = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  const rows = db.prepare(`${baseQuery()} ${where} ORDER BY a.session_date ASC, a.start_time ASC`).all(...params);
  res.json(rows);
});

// Update appointment status (therapist completes a session, etc.)
router.put("/:id", requireRole("admin", "doctor", "therapist"), (req: AuthedRequest, res) => {
  const { status, sessionNotes } = req.body;
  const valid = ["Upcoming", "In Progress", "Completed", "Missed", "Rescheduled", "Cancelled"];
  if (status && !valid.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const appt = db.prepare(`SELECT * FROM appointments WHERE id = ?`).get(req.params.id) as any;
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  if (req.user!.role === "therapist") {
    const therapist = db.prepare(`SELECT id FROM therapists WHERE user_id = ?`).get(req.user!.id) as any;
    if (!therapist || therapist.id !== appt.therapist_id) {
      return res.status(403).json({ error: "Forbidden: appointment is not assigned to this therapist" });
    }
  }

  if (req.user!.role === "doctor") {
    const doctor = db.prepare(`SELECT id FROM doctors WHERE user_id = ?`).get(req.user!.id) as any;
    if (!doctor || doctor.id !== appt.doctor_id) {
      return res.status(403).json({ error: "Forbidden: appointment is not assigned to this doctor" });
    }
  }

  db.prepare(
    `UPDATE appointments SET status = COALESCE(?, status), session_notes = COALESCE(?, session_notes), updated_at = datetime('now') WHERE id = ?`
  ).run(status || null, sessionNotes || null, req.params.id);

  if (status === "Completed") {
    db.prepare(
      `INSERT INTO progress_records (id, patient_id, treatment_plan_id, appointment_id, note, recorded_by)
       VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?)`
    ).run(appt.patient_id, appt.treatment_plan_id, appt.id, sessionNotes || "Session completed.", req.user!.id);
  }

  res.json({ ok: true });
});

export default router;
