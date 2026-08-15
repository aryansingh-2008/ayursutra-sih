import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/index.js";
const router = Router();
router.use(requireAuth);
router.get("/", (_req, res) => {
  const therapies = db.prepare(`SELECT * FROM therapies WHERE status = 'Active' ORDER BY category, name`).all() as any[];
  const templates = [
    { name: "Abhyanga Support Template", focus: "Therapeutic oil massage workflow", therapyKeywords: ["Abhyanga"], review: "Clinician selects duration and frequency." },
    { name: "Shirodhara Support Template", focus: "Shirodhara workflow", therapyKeywords: ["Shirodhara"], review: "Clinician confirms suitability and session plan." },
    { name: "Swedana Support Template", focus: "Herbal steam workflow", therapyKeywords: ["Swedana"], review: "Clinician confirms room and safety requirements." },
    { name: "Panchakarma Combination Template", focus: "Multi-therapy sequencing", therapyKeywords: ["Abhyanga", "Swedana", "Basti", "Nasya"], review: "Sequence must be clinically reviewed before activation." },
  ];
  res.json({ therapies, templates, disclaimer: "Reference workflow templates for the prototype. They are not medical prescriptions." });
});
export default router;
