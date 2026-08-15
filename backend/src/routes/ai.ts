import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "doctor"));

const disclaimer =
  "Prototype clinical decision-support only. This does not diagnose, prescribe, or replace a qualified clinician. Review every suggestion before use.";

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function rankTherapies(context: string, preferred: string, currentStatus: string) {
  const text = normalize(`${context} ${preferred}`);
  const preferredText = normalize(preferred);
  const therapies = db
    .prepare(`SELECT * FROM therapies WHERE status = 'Active' ORDER BY name`)
    .all() as any[];

  // Explainable local scoring: this is intentionally decision support, not diagnosis.
  const rules: Array<{ keywords: string[]; points: number; reason: string }> = [
    { keywords: ["stress", "sleep", "insomnia", "relax"], points: 14, reason: "matches the entered sleep/stress context" },
    { keywords: ["stiff", "muscle", "mobility", "pain", "joint"], points: 14, reason: "matches the entered mobility/muscle context" },
    { keywords: ["steam", "sweat", "stiffness"], points: 10, reason: "matches the entered steam/heat context" },
    { keywords: ["nasal", "sinus", "congestion"], points: 14, reason: "matches the entered nasal context" },
    { keywords: ["digest", "constipation", "bloating"], points: 12, reason: "matches the entered digestive context" },
    { keywords: ["skin", "dryness"], points: 10, reason: "matches the entered skin context" },
    { keywords: ["stress", "wellness", "relaxation"], points: 8, reason: "matches the stated wellness goal" },
  ];

  return therapies
    .map((t) => {
      const hay = normalize(`${t.name} ${t.category} ${t.assigned_therapist_type} ${t.required_room_type}`);
      let score = 50;
      const reasons: string[] = [];

      for (const rule of rules) {
        if (rule.keywords.some((k) => text.includes(k)) && rule.keywords.some((k) => hay.includes(k))) {
          score += rule.points;
          reasons.push(rule.reason);
        }
      }

      if (preferredText && hay.includes(preferredText)) {
        score += 18;
        reasons.push("matches the selected therapy preference");
      } else if (preferredText && hay.split(" ").some((word) => word.length > 3 && preferredText.includes(word))) {
        score += 8;
        reasons.push("partially matches the selected therapy preference");
      }

      if (currentStatus === "New") score += 2;
      if (t.category) score += 1;

      const fit = Math.min(96, Math.max(35, score));
      return {
        therapyId: t.id,
        therapyName: t.name,
        category: t.category,
        durationMinutes: t.default_duration_minutes,
        requiredRoomType: t.required_room_type,
        therapistType: t.assigned_therapist_type,
        score: fit,
        confidenceLabel: fit >= 80 ? "Strong contextual match" : fit >= 65 ? "Moderate contextual match" : "Available option — clinician review",
        reasons: reasons.length ? reasons : ["available active therapy in the clinic protocol library"],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

async function optionalLlmExplain(input: {
  patient: any;
  symptoms: string;
  goals: string;
  preferredTherapy: string;
  recommendations: any[];
}) {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS || 8000);

  // The local rules engine is the reliable baseline. A live LLM is optional.
  if (!apiKey) return { mode: "rules", explanation: null as string | null };

  const payload = {
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a clinical workflow support assistant for a Panchakarma management prototype. Do not diagnose, prescribe, invent therapies, or claim clinical certainty. Only explain and organize the candidate therapies already supplied. Emphasize that a qualified clinician must review and approve.",
      },
      {
        role: "user",
        content: JSON.stringify({
          patient: {
            age: input.patient.age,
            gender: input.patient.gender,
            treatmentStatus: input.patient.treatment_status,
          },
          clinicianContext: input.symptoms,
          goals: input.goals,
          preferredTherapy: input.preferredTherapy,
          candidateTherapies: input.recommendations,
        }),
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`Optional LLM unavailable (${response.status}); using local rules fallback.`);
      return { mode: "rules-fallback", explanation: null as string | null };
    }

    const data = (await response.json()) as any;
    const explanation = data?.choices?.[0]?.message?.content;
    return {
      mode: explanation ? "llm" : "rules",
      explanation: typeof explanation === "string" ? explanation.trim() : null,
    };
  } catch (error) {
    console.warn("Optional LLM unavailable; using local rules fallback.", error);
    return { mode: "rules-fallback", explanation: null as string | null };
  }
}

router.post("/recommendation", async (req, res) => {
  try {
    const { patientId, symptoms = "", goals = "", preferredTherapy = "" } = req.body;
    if (!patientId) return res.status(400).json({ error: "patientId is required" });

  const patient = db
    .prepare(
      `SELECT p.id, u.name, p.age, p.gender, p.treatment_status, du.name as doctor_name
       FROM patients p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN doctors d ON d.id = p.assigned_doctor_id
       LEFT JOIN users du ON du.id = d.user_id
       WHERE p.id = ?`
    )
    .get(patientId) as any;

  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const ranked = rankTherapies(`${symptoms} ${goals}`, preferredTherapy, patient.treatment_status);
  const recommendations = ranked.map((r, index) => ({
    ...r,
    rank: index + 1,
    suggestedSessions: index === 0 ? 3 : 2,
    suggestedFrequency: "Review with clinician",
  }));

  const ai = await optionalLlmExplain({
    patient,
    symptoms,
    goals,
    preferredTherapy,
    recommendations,
  });

  const safetyFlags = [
    !symptoms.trim() && !goals.trim()
      ? "Add the clinician's assessment context for a more meaningful recommendation."
      : "Context captured from clinician input.",
    "Confirm contraindications, suitability, sequencing and frequency clinically before approving a plan.",
  ];

    res.status(200).json({
      patient,
      recommendations,
      reasoning: [
        "Uses the clinic's configured active therapy library.",
        "Ranks options against clinician-entered context and optional preference.",
        "Shows transparent reasons, fit signals and operational requirements.",
      ],
      safetyFlags,
      disclaimer,
      aiMode: ai.mode,
      aiExplanation: ai.explanation,
      serviceStatus: ai.mode === "llm" ? "llm-assisted" : "local-fallback",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI recommendation route failed:", error);
    res.status(500).json({
      error: "Unable to generate the recommendation right now. The rest of AyurSutra remains available.",
    });
  }
});

router.get("/progress/:patientId", (req, res) => {
  const patient = db
    .prepare(`SELECT id, treatment_status FROM patients WHERE id = ?`)
    .get(req.params.patientId) as any;
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const appointments = db
    .prepare(`SELECT status FROM appointments WHERE patient_id = ?`)
    .all(req.params.patientId) as any[];
  const progress = db
    .prepare(
      `SELECT note, created_at FROM progress_records WHERE patient_id = ? ORDER BY created_at ASC`
    )
    .all(req.params.patientId) as any[];

  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "Completed").length;
  const missed = appointments.filter((a) => a.status === "Missed").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const momentum = completed >= 3 && missed === 0 ? "positive" : missed >= 2 ? "attention" : "steady";
  const insight =
    momentum === "positive"
      ? "Session adherence is strong in the recorded data. Continue routine review by the treating clinician."
      : momentum === "attention"
        ? "Multiple missed sessions are recorded. Consider a clinician-led follow-up and schedule review."
        : "The recorded session pattern is steady. Continue monitoring progress notes and attendance.";

  res.json({
    total,
    completed,
    missed,
    completionRate,
    momentum,
    insight,
    recentProgress: progress.slice(-5),
    disclaimer,
  });
});

export default router;
