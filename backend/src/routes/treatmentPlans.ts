import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/:id", (req, res) => {
  const plan = db.prepare(`SELECT * FROM treatment_plans WHERE id = ?`).get(req.params.id);
  if (!plan) return res.status(404).json({ error: "Treatment plan not found" });
  const therapies = db
    .prepare(
      `SELECT ptt.*, t.name as therapy_name, t.default_duration_minutes
       FROM treatment_plan_therapies ptt JOIN therapies t ON t.id = ptt.therapy_id
       WHERE ptt.treatment_plan_id = ? ORDER BY ptt.sequence_order`
    )
    .all(req.params.id);
  res.json({ ...plan, therapies });
});

// Create a treatment plan with selected therapies
router.post("/", requireRole("doctor", "admin"), (req, res) => {
  const { patientId, doctorId, planName, startDate, endDate, frequency, notes, followUpDate, therapies } = req.body;
  if (!patientId || !doctorId || !planName || !startDate || !endDate) {
    return res.status(400).json({ error: "patientId, doctorId, planName, startDate, endDate are required" });
  }
  const id = uuid();
  db.prepare(
    `INSERT INTO treatment_plans (id, patient_id, doctor_id, plan_name, start_date, end_date, frequency, notes, follow_up_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft')`
  ).run(id, patientId, doctorId, planName, startDate, endDate, frequency || null, notes || null, followUpDate || null);

  if (Array.isArray(therapies)) {
    therapies.forEach((t: any, idx: number) => {
      db.prepare(
        `INSERT INTO treatment_plan_therapies (id, treatment_plan_id, therapy_id, sequence_order, total_sessions) VALUES (?, ?, ?, ?, ?)`
      ).run(uuid(), id, t.therapyId, idx + 1, t.totalSessions || 1);
    });
  }

  db.prepare(`UPDATE patients SET treatment_status = 'Assessment' WHERE id = ?`).run(patientId);

  res.status(201).json({ id });
});

router.patch("/:id/status", requireRole("doctor", "admin"), (req, res) => {
  const { status } = req.body;
  const valid = ["Draft", "Active", "Paused", "Completed", "Cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
  db.prepare(`UPDATE treatment_plans SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
  if (status === "Active") {
    const plan = db.prepare(`SELECT patient_id FROM treatment_plans WHERE id = ?`).get(req.params.id) as any;
    if (plan) db.prepare(`UPDATE patients SET treatment_status = 'Active' WHERE id = ?`).run(plan.patient_id);
  }
  res.json({ ok: true });
});

export default router;
