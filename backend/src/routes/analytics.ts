import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "doctor"));

router.get("/", (_req, res) => {
  const totalPatients = (db.prepare(`SELECT COUNT(*) c FROM patients`).get() as any).c;
  const activePlans = (db.prepare(`SELECT COUNT(*) c FROM treatment_plans WHERE status = 'Active'`).get() as any).c;
  const today = new Date().toISOString().slice(0, 10);
  const todayTherapies = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE session_date = ?`).get(today) as any).c;
  const completed = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE status = 'Completed'`).get() as any).c;
  const missed = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE status = 'Missed'`).get() as any).c;
  const rescheduled = (db.prepare(`SELECT COUNT(*) c FROM appointments WHERE status = 'Rescheduled'`).get() as any).c;

  const sessionsPerDay = db
    .prepare(
      `SELECT session_date as date, COUNT(*) as count FROM appointments GROUP BY session_date ORDER BY session_date ASC`
    )
    .all();

  const therapistWorkload = db
    .prepare(
      `SELECT u.name as therapist, COUNT(*) as sessions
       FROM appointments a JOIN therapists t ON t.id = a.therapist_id JOIN users u ON u.id = t.user_id
       GROUP BY a.therapist_id ORDER BY sessions DESC`
    )
    .all();

  const roomUtilization = db
    .prepare(
      `SELECT r.name as room, COUNT(*) as sessions FROM appointments a JOIN rooms r ON r.id = a.room_id
       GROUP BY a.room_id ORDER BY sessions DESC`
    )
    .all();

  res.json({
    totalPatients,
    activePlans,
    todayTherapies,
    completed,
    missed,
    rescheduled,
    sessionsPerDay,
    therapistWorkload,
    roomUtilization,
  });
});

export default router;
