import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { signToken } from "../middleware/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken({ id: user.id, role: user.role, email: user.email });

  // Attach role-specific profile id
  let profile: any = { id: user.id, name: user.name, email: user.email, role: user.role };
  if (user.role === "doctor") {
    const d = db.prepare(`SELECT id FROM doctors WHERE user_id = ?`).get(user.id) as any;
    profile.doctorId = d?.id;
  } else if (user.role === "therapist") {
    const t = db.prepare(`SELECT id FROM therapists WHERE user_id = ?`).get(user.id) as any;
    profile.therapistId = t?.id;
  } else if (user.role === "patient") {
    const p = db.prepare(`SELECT id FROM patients WHERE user_id = ?`).get(user.id) as any;
    profile.patientId = p?.id;
  }

  res.json({ token, user: profile });
});

export default router;
