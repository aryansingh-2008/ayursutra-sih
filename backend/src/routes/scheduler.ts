import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { findSlot, generatePlanSchedule, createAppointment } from "../services/scheduler.js";

const router = Router();
router.use(requireAuth);

// Check a single slot for conflicts and get alternatives
router.post("/check-conflict", (req, res) => {
  const { patientId, therapyId, preferredDate, preferredStartTime, therapistId } = req.body;
  if (!patientId || !therapyId || !preferredDate) {
    return res.status(400).json({ error: "patientId, therapyId, and preferredDate are required" });
  }
  const result = findSlot({ patientId, therapyId, preferredDate, preferredStartTime, therapistId });
  res.json(result);
});

// Generate a full draft schedule for a treatment plan (does not persist)
router.post("/generate", requireRole("doctor", "admin"), (req, res) => {
  const { treatmentPlanId } = req.body;
  if (!treatmentPlanId) return res.status(400).json({ error: "treatmentPlanId is required" });
  try {
    const draft = generatePlanSchedule(treatmentPlanId);
    res.json(draft);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Approve a draft schedule (persist all appointments)
router.post("/approve", requireRole("doctor", "admin"), (req, res) => {
  const { treatmentPlanId, patientId, doctorId, schedule } = req.body;
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return res.status(400).json({ error: "schedule array is required" });
  }
  const created: string[] = [];
  for (const item of schedule) {
    const id = createAppointment({
      patientId,
      therapistId: item.therapistId,
      doctorId,
      therapyId: item.therapyId,
      treatmentPlanId,
      roomId: item.roomId,
      sessionDate: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
    });
    created.push(id);
  }
  db.prepare(`UPDATE treatment_plans SET status = 'Active', updated_at = datetime('now') WHERE id = ?`).run(treatmentPlanId);
  db.prepare(`UPDATE patients SET treatment_status = 'Active' WHERE id = ?`).run(patientId);
  res.status(201).json({ createdAppointmentIds: created });
});

export default router;
