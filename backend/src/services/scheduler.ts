import { db } from "../db/index.js";
import { v4 as uuid } from "uuid";

export interface SlotRequest {
  patientId: string;
  therapyId: string;
  treatmentPlanId?: string;
  preferredDate: string; // YYYY-MM-DD
  preferredStartTime?: string; // HH:MM, optional — will search if omitted
  therapistId?: string; // optional preferred therapist
}

export interface ProposedSlot {
  date: string;
  startTime: string;
  endTime: string;
  therapistId: string;
  therapistName: string;
  roomId: string;
  roomName: string;
}

export interface ConflictResult {
  conflict: boolean;
  reason?: string;
  suggestions: ProposedSlot[];
}

const WORK_START = "09:00";
const WORK_END = "18:00";
const SLOT_STEP_MIN = 30;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

/** Check if a therapist is free for [start,end) on a given date, considering weekly availability + existing appts */
function isTherapistFree(therapistId: string, date: string, startMin: number, endMin: number): boolean {
  const dow = new Date(date + "T00:00:00").getDay();
  const avail = db
    .prepare(`SELECT * FROM therapist_availability WHERE therapist_id = ? AND day_of_week = ?`)
    .all(therapistId, dow) as any[];
  if (avail.length > 0) {
    const withinAvailability = avail.some(
      (a) => toMinutes(a.start_time) <= startMin && toMinutes(a.end_time) >= endMin
    );
    if (!withinAvailability) return false;
  }
  const existing = db
    .prepare(
      `SELECT start_time, end_time FROM appointments WHERE therapist_id = ? AND session_date = ? AND status NOT IN ('Cancelled','Missed')`
    )
    .all(therapistId, date) as any[];
  return !existing.some((e) => overlaps(startMin, endMin, toMinutes(e.start_time), toMinutes(e.end_time)));
}

function isRoomFree(roomId: string, date: string, startMin: number, endMin: number): boolean {
  const existing = db
    .prepare(
      `SELECT start_time, end_time FROM appointments WHERE room_id = ? AND session_date = ? AND status NOT IN ('Cancelled','Missed')`
    )
    .all(roomId, date) as any[];
  return !existing.some((e) => overlaps(startMin, endMin, toMinutes(e.start_time), toMinutes(e.end_time)));
}

function isPatientFree(patientId: string, date: string, startMin: number, endMin: number): boolean {
  const existing = db
    .prepare(
      `SELECT start_time, end_time FROM appointments WHERE patient_id = ? AND session_date = ? AND status NOT IN ('Cancelled','Missed')`
    )
    .all(patientId, date) as any[];
  return !existing.some((e) => overlaps(startMin, endMin, toMinutes(e.start_time), toMinutes(e.end_time)));
}

/**
 * Core conflict-checking + suggestion engine.
 * Tries the preferred therapist/time first; if unavailable, scans therapists of the
 * right type and rooms of the right type across the day for open slots.
 */
export function findSlot(req: SlotRequest): ConflictResult {
  const therapy = db.prepare(`SELECT * FROM therapies WHERE id = ?`).get(req.therapyId) as any;
  if (!therapy) return { conflict: true, reason: "Therapy not found", suggestions: [] };
  const durationMin = therapy.default_duration_minutes;

  const therapists = (
    req.therapistId
      ? db.prepare(`SELECT t.*, u.name FROM therapists t JOIN users u ON u.id = t.user_id WHERE t.id = ?`).all(req.therapistId)
      : db
          .prepare(
            `SELECT t.*, u.name FROM therapists t JOIN users u ON u.id = t.user_id WHERE (t.specialization = ? OR ? IS NULL)`
          )
          .all(therapy.assigned_therapist_type, therapy.assigned_therapist_type)
  ) as any[];

  const rooms = db
    .prepare(`SELECT * FROM rooms WHERE (room_type = ? OR ? IS NULL) AND status = 'Available'`)
    .all(therapy.required_room_type, therapy.required_room_type) as any[];

  const candidateTherapists = therapists.length > 0 ? therapists : (db.prepare(`SELECT t.*, u.name FROM therapists t JOIN users u ON u.id = t.user_id`).all() as any[]);
  const candidateRooms = rooms.length > 0 ? rooms : (db.prepare(`SELECT * FROM rooms WHERE status='Available'`).all() as any[]);

  // 1. Try the exact preferred slot first, if a preferred time was given
  if (req.preferredStartTime) {
    const startMin = toMinutes(req.preferredStartTime);
    const endMin = startMin + durationMin;
    for (const t of candidateTherapists) {
      if (!isTherapistFree(t.id, req.preferredDate, startMin, endMin)) continue;
      if (!isPatientFree(req.patientId, req.preferredDate, startMin, endMin)) {
        return {
          conflict: true,
          reason: `Patient already has a session overlapping ${req.preferredStartTime} on ${req.preferredDate}.`,
          suggestions: scanDay(req, therapy, candidateTherapists, candidateRooms, durationMin),
        };
      }
      for (const r of candidateRooms) {
        if (isRoomFree(r.id, req.preferredDate, startMin, endMin)) {
          return {
            conflict: false,
            suggestions: [
              {
                date: req.preferredDate,
                startTime: req.preferredStartTime,
                endTime: toHHMM(endMin),
                therapistId: t.id,
                therapistName: t.name,
                roomId: r.id,
                roomName: r.name,
              },
            ],
          };
        }
      }
    }
    // preferred slot didn't work — fall through to suggestions
    return {
      conflict: true,
      reason: `Requested slot ${req.preferredStartTime} on ${req.preferredDate} is unavailable (therapist or room already booked).`,
      suggestions: scanDay(req, therapy, candidateTherapists, candidateRooms, durationMin),
    };
  }

  // 2. No preferred time — just scan the day for the first open slot
  const suggestions = scanDay(req, therapy, candidateTherapists, candidateRooms, durationMin);
  return { conflict: suggestions.length === 0, suggestions };
}

function scanDay(
  req: SlotRequest,
  therapy: any,
  candidateTherapists: any[],
  candidateRooms: any[],
  durationMin: number
): ProposedSlot[] {
  const suggestions: ProposedSlot[] = [];
  const startBound = toMinutes(WORK_START);
  const endBound = toMinutes(WORK_END);

  for (let start = startBound; start + durationMin <= endBound; start += SLOT_STEP_MIN) {
    const end = start + durationMin;
    if (!isPatientFree(req.patientId, req.preferredDate, start, end)) continue;
    for (const t of candidateTherapists) {
      if (!isTherapistFree(t.id, req.preferredDate, start, end)) continue;
      for (const r of candidateRooms) {
        if (!isRoomFree(r.id, req.preferredDate, start, end)) continue;
        suggestions.push({
          date: req.preferredDate,
          startTime: toHHMM(start),
          endTime: toHHMM(end),
          therapistId: t.id,
          therapistName: t.name,
          roomId: r.id,
          roomName: r.name,
        });
        if (suggestions.length >= 3) return suggestions;
      }
    }
  }
  return suggestions;
}

/**
 * Generate a full multi-day treatment schedule for a treatment plan:
 * cycles through the plan's therapies in sequence, one per day (or per frequency),
 * finding the best available slot each day. Does NOT persist — returns a draft
 * for doctor review/approval.
 */
export function generatePlanSchedule(treatmentPlanId: string) {
  const plan = db.prepare(`SELECT * FROM treatment_plans WHERE id = ?`).get(treatmentPlanId) as any;
  if (!plan) throw new Error("Treatment plan not found");

  const planTherapies = db
    .prepare(
      `SELECT ptt.*, th.name as therapy_name, th.default_duration_minutes
       FROM treatment_plan_therapies ptt
       JOIN therapies th ON th.id = ptt.therapy_id
       WHERE ptt.treatment_plan_id = ? ORDER BY ptt.sequence_order ASC`
    )
    .all(treatmentPlanId) as any[];

  const draft: any[] = [];
  let cursor = new Date(plan.start_date + "T00:00:00");
  const endDate = new Date(plan.end_date + "T00:00:00");

  // Expand each therapy into its total_sessions, interleaved by sequence order (round robin)
  const queue: { therapyId: string; therapyName: string }[] = [];
  const maxSessions = Math.max(...planTherapies.map((p) => p.total_sessions || 1), 1);
  for (let s = 0; s < maxSessions; s++) {
    for (const pt of planTherapies) {
      if (s < (pt.total_sessions || 1)) queue.push({ therapyId: pt.therapy_id, therapyName: pt.therapy_name });
    }
  }

  let qi = 0;
  while (cursor <= endDate && qi < queue.length) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const item = queue[qi];
    const result = findSlot({
      patientId: plan.patient_id,
      therapyId: item.therapyId,
      treatmentPlanId,
      preferredDate: dateStr,
    });
    if (!result.conflict && result.suggestions.length > 0) {
      const { date: _d, ...slot } = result.suggestions[0];
      draft.push({
        day: draft.length + 1,
        date: dateStr,
        therapyId: item.therapyId,
        therapyName: item.therapyName,
        ...slot,
      });
      qi++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    treatmentPlanId,
    totalDays: draft.length,
    schedule: draft,
    unscheduled: queue.length - qi,
  };
}

export function createAppointment(params: {
  patientId: string;
  therapistId: string;
  doctorId?: string;
  therapyId: string;
  treatmentPlanId?: string;
  roomId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
}) {
  const id = uuid();
  db.prepare(
    `INSERT INTO appointments (id, patient_id, therapist_id, doctor_id, therapy_id, treatment_plan_id, room_id, session_date, start_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`
  ).run(
    id,
    params.patientId,
    params.therapistId,
    params.doctorId || null,
    params.therapyId,
    params.treatmentPlanId || null,
    params.roomId,
    params.sessionDate,
    params.startTime,
    params.endTime
  );
  return id;
}
