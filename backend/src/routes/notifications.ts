import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", (req: AuthedRequest, res) => {
  const rows = db
    .prepare(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
    .all(req.user!.id);
  res.json(rows);
});

router.put("/:id/read", (req: AuthedRequest, res) => {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`).run(req.params.id, req.user!.id);
  res.json({ ok: true });
});

export default router;
