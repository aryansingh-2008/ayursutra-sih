import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "doctor"));

/**
 * Explainable, local "AI-style" care-coordination brief.
 * This intentionally does not diagnose, prescribe, or infer medical conditions.
 * It summarizes existing operational data so the clinician can review it quickly.
 */
router.get("/patient/:id", (req, res) => {
  const patient = db.prepare(`
    SELECT p.*, u.name, u.email, du.name as doctor_name
    FROM patients p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN doctors d ON d.id = p.assigned_doctor_id
    LEFT JOIN users du ON du.id = d.user_id
    WHERE p.id = ?
  `).get(req.params.id) as any;

  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const appointments = db.prepare(`
    SELECT a.session_date, a.start_time, a.end_time, a.status,
           th.name as therapy_name, tu.name as therapist_name, r.name as room_name
    FROM appointments a
    JOIN therapies th ON th.id = a.therapy_id
    JOIN therapists t ON t.id = a.therapist_id
    JOIN users tu ON tu.id = t.user_id
    JOIN rooms r ON r.id = a.room_id
    WHERE a.patient_id = ?
    ORDER BY a.session_date DESC, a.start_time DESC
  `).all(req.params.id) as any[];

  const plans = db.prepare(`
    SELECT plan_name, start_date, end_date, frequency, status, follow_up_date
    FROM treatment_plans WHERE patient_id = ? ORDER BY created_at DESC
  `).all(req.params.id) as any[];

  const progress = db.prepare(`
    SELECT note, created_at FROM progress_records
    WHERE patient_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(req.params.id) as any[];

  const completed = appointments.filter(a => a.status === "Completed").length;
  const missed = appointments.filter(a => a.status === "Missed").length;
  const upcoming = appointments.filter(a => ["Upcoming", "In Progress"].includes(a.status));
  const completionRate = appointments.length ? Math.round((completed / appointments.length) * 100) : 0;

  const attention: string[] = [];
  if (missed > 0) attention.push(`${missed} missed session${missed > 1 ? "s" : ""} recorded — review follow-up with the patient.`);
  if (upcoming.length === 0 && plans.some(p => p.status === "Active")) attention.push("Active treatment plan has no upcoming session in the current schedule.");
  if (plans.some(p => p.status === "Draft")) attention.push("A draft treatment plan still needs scheduling/doctor approval.");
  if (attention.length === 0) attention.push("No operational exception detected from the available scheduling data.");

  const next = upcoming.sort((a, b) => `${a.session_date} ${a.start_time}`.localeCompare(`${b.session_date} ${b.start_time}`))[0] || null;

  res.json({
    patient: { id: patient.id, name: patient.name, code: patient.patient_code, status: patient.treatment_status },
    summary: `Operational summary for ${patient.name}: ${completed} completed, ${missed} missed, and ${upcoming.length} upcoming session${upcoming.length === 1 ? "" : "s"}. Session completion is ${completionRate}%.`,
    completionRate,
    attention,
    nextSession: next,
    activePlan: plans.find(p => p.status === "Active") || plans[0] || null,
    recentProgress: progress,
    disclaimer: "Decision-support only. Review this summary with the treating professional; it does not provide diagnosis or treatment advice."
  });
});

export default router;
