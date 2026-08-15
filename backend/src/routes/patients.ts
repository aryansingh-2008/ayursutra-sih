import { Router } from "express";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { requireAuth, requireRole, AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// List patients (admin/doctor/therapist)
router.get("/", requireRole("admin", "doctor", "therapist"), (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, u.name, u.email, u.phone, du.name as doctor_name
       FROM patients p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN doctors d ON d.id = p.assigned_doctor_id
       LEFT JOIN users du ON du.id = d.user_id
       ORDER BY p.registration_date DESC`
    )
    .all();
  res.json(rows);
});

// Get single patient with full profile + timeline
router.get("/:id", (req: AuthedRequest, res) => {
  const patient = db
    .prepare(
      `SELECT p.*, u.name, u.email, u.phone, du.name as doctor_name, d.id as doctor_id
       FROM patients p JOIN users u ON u.id = p.user_id
       LEFT JOIN doctors d ON d.id = p.assigned_doctor_id
       LEFT JOIN users du ON du.id = d.user_id
       WHERE p.id = ?`
    )
    .get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  // Patients may only view themselves
  if (req.user!.role === "patient") {
    const self = db.prepare(`SELECT id FROM patients WHERE user_id = ?`).get(req.user!.id) as any;
    if (!self || self.id !== req.params.id) return res.status(403).json({ error: "Forbidden" });
  }

  const plans = db
    .prepare(`SELECT * FROM treatment_plans WHERE patient_id = ? ORDER BY created_at DESC`)
    .all(req.params.id);
  const appointments = db
    .prepare(
      `SELECT a.*, th.name as therapy_name, tu.name as therapist_name, r.name as room_name
       FROM appointments a
       JOIN therapies th ON th.id = a.therapy_id
       JOIN therapists t ON t.id = a.therapist_id
       JOIN users tu ON tu.id = t.user_id
       JOIN rooms r ON r.id = a.room_id
       WHERE a.patient_id = ? ORDER BY a.session_date ASC, a.start_time ASC`
    )
    .all(req.params.id);
  const progress = db
    .prepare(`SELECT * FROM progress_records WHERE patient_id = ? ORDER BY created_at DESC`)
    .all(req.params.id);

  res.json({ ...patient, plans, appointments, progress });
});

// Register new patient (admin/doctor)
router.post("/", requireRole("admin", "doctor"), (req, res) => {
  const { name, email, phone, age, gender, assignedDoctorId, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) return res.status(409).json({ error: "A user with this email already exists" });

  const userId = uuid();
  const patientId = uuid();
  const patientCode = "PT" + Math.floor(1000 + Math.random() * 9000);
  const hash = bcrypt.hashSync(password || "welcome123", 10);

  db.prepare(`INSERT INTO users (id, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, 'patient', ?)`).run(
    userId,
    name,
    email,
    hash,
    phone || null
  );
  db.prepare(
    `INSERT INTO patients (id, user_id, patient_code, age, gender, assigned_doctor_id, treatment_status) VALUES (?, ?, ?, ?, ?, ?, 'New')`
  ).run(patientId, userId, patientCode, age || null, gender || null, assignedDoctorId || null);

  res.status(201).json({ id: patientId, patientCode });
});


// Update patient profile (admin only)
router.put("/:id", requireRole("admin"), (req: AuthedRequest, res) => {
  const { name, email, phone, age, gender, assignedDoctorId, treatmentStatus } = req.body;
  const patient = db.prepare(`SELECT p.*, u.id as user_id FROM patients p JOIN users u ON u.id = p.user_id WHERE p.id = ?`).get(req.params.id) as any;
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  if (!name || !email) return res.status(400).json({ error: "Name and email are required" });

  const duplicate = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`).get(email, patient.user_id) as any;
  if (duplicate) return res.status(409).json({ error: "A user with this email already exists" });

  const update = db.transaction(() => {
    db.prepare(`UPDATE users SET name = ?, email = ?, phone = ?, updated_at = datetime('now') WHERE id = ?`).run(
      name, email, phone || null, patient.user_id
    );
    db.prepare(`UPDATE patients SET age = ?, gender = ?, assigned_doctor_id = ?, treatment_status = ? WHERE id = ?`).run(
      age ?? null, gender || null, assignedDoctorId || null, treatmentStatus || patient.treatment_status, req.params.id
    );
  });
  update();

  res.json({ message: "Patient updated successfully" });
});

// Delete a patient and their dependent clinical records (admin only)
router.delete("/:id", requireRole("admin"), (req: AuthedRequest, res) => {
  const patient = db.prepare(`SELECT p.id, p.user_id FROM patients p WHERE p.id = ?`).get(req.params.id) as any;
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const remove = db.transaction(() => {
    const plans = db.prepare(`SELECT id FROM treatment_plans WHERE patient_id = ?`).all(req.params.id) as any[];
    const planIds = plans.map((p) => p.id);

    db.prepare(`DELETE FROM feedback WHERE patient_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM progress_records WHERE patient_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM appointments WHERE patient_id = ?`).run(req.params.id);
    if (planIds.length) {
      const placeholders = planIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM treatment_plan_therapies WHERE treatment_plan_id IN (${placeholders})`).run(...planIds);
    }
    db.prepare(`DELETE FROM treatment_plans WHERE patient_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM patients WHERE id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(patient.user_id);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(patient.user_id);
  });
  remove();

  res.json({ message: "Patient deleted successfully" });
});

export default router;
