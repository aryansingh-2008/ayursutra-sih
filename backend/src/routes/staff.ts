import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { db } from "../db/index.js";
import { AuthedRequest, requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole("admin"));

const STAFF_ROLES = ["admin", "doctor", "therapist"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

function validRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

router.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at,
              d.id as doctor_id, d.specialization as doctor_specialization,
              t.id as therapist_id, t.specialization as therapist_specialization
       FROM users u
       LEFT JOIN doctors d ON d.user_id = u.id
       LEFT JOIN therapists t ON t.user_id = u.id
       WHERE u.role IN ('admin','doctor','therapist')
       ORDER BY CASE u.role WHEN 'admin' THEN 1 WHEN 'doctor' THEN 2 ELSE 3 END, u.name`
    )
    .all() as any[];

  res.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      specialization: row.doctor_specialization || row.therapist_specialization || null,
      profileId: row.doctor_id || row.therapist_id || null,
      createdAt: row.created_at,
    }))
  );
});

router.post("/", (req: AuthedRequest, res) => {
  const { name, email, phone, password, role, specialization } = req.body;

  if (!name?.trim() || !email?.trim() || !role) {
    return res.status(400).json({ error: "Name, email and role are required" });
  }
  if (!validRole(role)) {
    return res.status(400).json({ error: "Role must be admin, doctor or therapist" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(normalizedEmail);
  if (existing) return res.status(409).json({ error: "A user with this email already exists" });

  const userId = uuid();
  const hash = bcrypt.hashSync(password || "welcome123", 10);

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, phone)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, name.trim(), normalizedEmail, hash, role, phone?.trim() || null);

    if (role === "doctor") {
      db.prepare(`INSERT INTO doctors (id, user_id, specialization) VALUES (?, ?, ?)`)
        .run(uuid(), userId, specialization?.trim() || null);
    }

    if (role === "therapist") {
      db.prepare(`INSERT INTO therapists (id, user_id, specialization) VALUES (?, ?, ?)`)
        .run(uuid(), userId, specialization?.trim() || null);
    }

    db.prepare(
      `INSERT INTO audit_logs (id, user_id, action, entity, entity_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(uuid(), req.user!.id, "created", "staff", userId);
  });

  create();
  res.status(201).json({ id: userId, message: "Staff member created successfully" });
});

router.put("/:id", (req: AuthedRequest, res) => {
  const { name, email, phone, password, role, specialization } = req.body;
  const existing = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.params.id) as any;

  if (!existing || !STAFF_ROLES.includes(existing.role)) {
    return res.status(404).json({ error: "Staff member not found" });
  }
  if (!name?.trim() || !email?.trim() || !role || !validRole(role)) {
    return res.status(400).json({ error: "Name, email and a valid staff role are required" });
  }
  if (req.params.id === req.user!.id && role !== "admin") {
    return res.status(400).json({ error: "You cannot change your own admin role" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const duplicate = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`).get(normalizedEmail, req.params.id);
  if (duplicate) return res.status(409).json({ error: "A user with this email already exists" });

  try {
    const update = db.transaction(() => {
      if (existing.role !== role) {
        if (existing.role === "doctor") {
          const linked = db.prepare(
            `SELECT
               (SELECT COUNT(*) FROM patients WHERE assigned_doctor_id = d.id) +
               (SELECT COUNT(*) FROM treatment_plans WHERE doctor_id = d.id) +
               (SELECT COUNT(*) FROM appointments WHERE doctor_id = d.id) AS count
             FROM doctors d WHERE d.user_id = ?`
          ).get(req.params.id) as any;
          if (linked?.count > 0) {
            throw new Error("Doctor has linked clinical records. Reassign patients/plans first.");
          }
        }

        if (existing.role === "therapist") {
          const linked = db.prepare(
            `SELECT COUNT(*) AS count FROM appointments a
             JOIN therapists t ON t.id = a.therapist_id
             WHERE t.user_id = ?`
          ).get(req.params.id) as any;
          if (linked?.count > 0) {
            throw new Error("Therapist has appointment history. Keep the current role or create a new account.");
          }
        }

        db.prepare(`DELETE FROM doctors WHERE user_id = ?`).run(req.params.id);
        db.prepare(`DELETE FROM therapists WHERE user_id = ?`).run(req.params.id);
      }

      if (password?.trim()) {
        db.prepare(
          `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, password_hash = ?, updated_at = datetime('now') WHERE id = ?`
        ).run(name.trim(), normalizedEmail, phone?.trim() || null, role, bcrypt.hashSync(password.trim(), 10), req.params.id);
      } else {
        db.prepare(
          `UPDATE users SET name = ?, email = ?, phone = ?, role = ?, updated_at = datetime('now') WHERE id = ?`
        ).run(name.trim(), normalizedEmail, phone?.trim() || null, role, req.params.id);
      }

      if (role === "doctor") {
        const profile = db.prepare(`SELECT id FROM doctors WHERE user_id = ?`).get(req.params.id) as any;
        if (profile) {
          db.prepare(`UPDATE doctors SET specialization = ? WHERE user_id = ?`).run(specialization?.trim() || null, req.params.id);
        } else {
          db.prepare(`INSERT INTO doctors (id, user_id, specialization) VALUES (?, ?, ?)`)
            .run(uuid(), req.params.id, specialization?.trim() || null);
        }
      } else if (role === "therapist") {
        const profile = db.prepare(`SELECT id FROM therapists WHERE user_id = ?`).get(req.params.id) as any;
        if (profile) {
          db.prepare(`UPDATE therapists SET specialization = ? WHERE user_id = ?`).run(specialization?.trim() || null, req.params.id);
        } else {
          db.prepare(`INSERT INTO therapists (id, user_id, specialization) VALUES (?, ?, ?)`)
            .run(uuid(), req.params.id, specialization?.trim() || null);
        }
      }

      db.prepare(
        `INSERT INTO audit_logs (id, user_id, action, entity, entity_id)
         VALUES (?, ?, ?, ?, ?)`
      ).run(uuid(), req.user!.id, "updated", "staff", req.params.id);
    });

    update();
    res.json({ message: "Staff member updated successfully" });
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message.includes("clinical records") || message.includes("appointment history")) {
      return res.status(409).json({ error: message });
    }
    throw error;
  }
});

router.delete("/:id", (req: AuthedRequest, res) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: "You cannot delete your own account" });
  }

  const user = db.prepare(`SELECT id, role FROM users WHERE id = ?`).get(req.params.id) as any;
  if (!user || !STAFF_ROLES.includes(user.role)) {
    return res.status(404).json({ error: "Staff member not found" });
  }

  if (user.role === "doctor") {
    const linked = db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM patients WHERE assigned_doctor_id = d.id) +
           (SELECT COUNT(*) FROM treatment_plans WHERE doctor_id = d.id) +
           (SELECT COUNT(*) FROM appointments WHERE doctor_id = d.id) AS count
         FROM doctors d WHERE d.user_id = ?`
      )
      .get(req.params.id) as any;
    if (linked?.count > 0) {
      return res.status(409).json({ error: "Doctor has linked clinical records. Reassign patients/plans first." });
    }
  }

  if (user.role === "therapist") {
    const linked = db
      .prepare(
        `SELECT COUNT(*) AS count FROM appointments a
         JOIN therapists t ON t.id = a.therapist_id
         WHERE t.user_id = ?`
      )
      .get(req.params.id) as any;
    if (linked?.count > 0) {
      return res.status(409).json({ error: "Therapist has appointment history and cannot be deleted." });
    }
  }

  const remove = db.transaction(() => {
    db.prepare(`DELETE FROM doctors WHERE user_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM therapists WHERE user_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(req.params.id);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(req.params.id);
    db.prepare(
      `INSERT INTO audit_logs (id, user_id, action, entity, entity_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(uuid(), req.user!.id, "deleted", "staff", req.params.id);
  });

  remove();
  res.json({ message: "Staff member deleted successfully" });
});

export default router;
