import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/doctors", (_req, res) => {
  res.json(
    db
      .prepare(`SELECT d.id, u.name, u.email, d.specialization FROM doctors d JOIN users u ON u.id = d.user_id`)
      .all()
  );
});

router.get("/therapists", (_req, res) => {
  res.json(
    db
      .prepare(`SELECT t.id, u.name, u.email, t.specialization FROM therapists t JOIN users u ON u.id = t.user_id`)
      .all()
  );
});

router.get("/therapies", (_req, res) => {
  res.json(db.prepare(`SELECT * FROM therapies ORDER BY name`).all());
});

router.post("/therapies", requireRole("admin"), (req, res) => {
  const { name, category, defaultDurationMinutes, requiredRoomType, assignedTherapistType } = req.body;
  const id = uuid();
  db.prepare(
    `INSERT INTO therapies (id, name, category, default_duration_minutes, required_room_type, assigned_therapist_type) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, name, category || null, defaultDurationMinutes || 60, requiredRoomType || null, assignedTherapistType || null);
  res.status(201).json({ id });
});

router.get("/rooms", (_req, res) => {
  res.json(db.prepare(`SELECT * FROM rooms ORDER BY name`).all());
});

export default router;
