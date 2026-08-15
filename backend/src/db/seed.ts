import { db, initSchema } from "./index.js";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

initSchema();

console.log("Seeding AyurSutra demo data...");

// Wipe existing data (idempotent re-seed for demos)
const tables = [
  "audit_logs",
  "notifications",
  "feedback",
  "progress_records",
  "appointments",
  "therapist_availability",
  "treatment_plan_therapies",
  "treatment_plans",
  "rooms",
  "therapies",
  "patients",
  "therapists",
  "doctors",
  "users",
];
for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();

const hash = (pw: string) => bcrypt.hashSync(pw, 10);
const DEMO_PW = "demo1234";

function makeUser(name: string, email: string, role: string, phone?: string) {
  const id = uuid();
  db.prepare(`INSERT INTO users (id, name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?, ?)`).run(
    id,
    name,
    email,
    hash(DEMO_PW),
    role,
    phone || null
  );
  return id;
}

// --- Admin ---
makeUser("Admin User", "admin@ayursutra.demo", "admin");

// --- Doctors ---
const drMehtaUserId = makeUser("Dr. Mehta", "dr.mehta@ayursutra.demo", "doctor");
const drSharmaUserId = makeUser("Dr. Sharma", "dr.sharma@ayursutra.demo", "doctor");
const drMehtaId = uuid();
const drSharmaId = uuid();
db.prepare(`INSERT INTO doctors (id, user_id, specialization) VALUES (?, ?, ?)`).run(drMehtaId, drMehtaUserId, "Panchakarma Specialist");
db.prepare(`INSERT INTO doctors (id, user_id, specialization) VALUES (?, ?, ?)`).run(drSharmaId, drSharmaUserId, "Ayurvedic Physician");

// --- Therapists ---
const therapistNames = [
  ["Therapist A - Kavya Nair", "Abhyanga"],
  ["Therapist B - Rohan Iyer", "Shirodhara"],
  ["Therapist C - Meera Pillai", "General Panchakarma"],
];
const therapistIds: string[] = [];
for (const [name, spec] of therapistNames) {
  const uid = makeUser(name, name.split(" - ")[1].toLowerCase().replace(" ", ".") + "@ayursutra.demo", "therapist");
  const tid = uuid();
  db.prepare(`INSERT INTO therapists (id, user_id, specialization) VALUES (?, ?, ?)`).run(tid, uid, spec);
  therapistIds.push(tid);
  // Standard weekly availability Mon-Sat 9am-6pm
  for (let dow = 1; dow <= 6; dow++) {
    db.prepare(
      `INSERT INTO therapist_availability (id, therapist_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, '09:00', '18:00')`
    ).run(uuid(), tid, dow);
  }
}
const [therapistAId, therapistBId, therapistCId] = therapistIds;

// --- Rooms ---
const roomIds: Record<string, string> = {};
for (const [name, type] of [
  ["Room 1", "Therapy Room"],
  ["Room 2", "Therapy Room"],
  ["Room 3", "Steam Room"],
]) {
  const id = uuid();
  db.prepare(`INSERT INTO rooms (id, name, room_type, status) VALUES (?, ?, ?, 'Available')`).run(id, name, type);
  roomIds[name] = id;
}

// --- Therapies ---
const therapies = [
  { name: "Abhyanga (Therapeutic Oil Massage)", category: "Snehana", duration: 60, roomType: "Therapy Room", therapistType: "Abhyanga" },
  { name: "Shirodhara", category: "Shirodhara", duration: 45, roomType: "Therapy Room", therapistType: "Shirodhara" },
  { name: "Swedana (Herbal Steam)", category: "Swedana", duration: 30, roomType: "Steam Room", therapistType: "General Panchakarma" },
  { name: "Basti (Medicated Enema Therapy)", category: "Panchakarma", duration: 45, roomType: "Therapy Room", therapistType: "General Panchakarma" },
  { name: "Nasya (Nasal Therapy)", category: "Panchakarma", duration: 30, roomType: "Therapy Room", therapistType: "General Panchakarma" },
];
const therapyIds: Record<string, string> = {};
for (const t of therapies) {
  const id = uuid();
  db.prepare(
    `INSERT INTO therapies (id, name, category, default_duration_minutes, required_room_type, assigned_therapist_type, status)
     VALUES (?, ?, ?, ?, ?, ?, 'Active')`
  ).run(id, t.name, t.category, t.duration, t.roomType, t.therapistType);
  therapyIds[t.name] = id;
}

// --- Patients ---
const patientDefs = [
  { name: "Rahul Sharma", email: "rahul.sharma@ayursutra.demo", age: 34, gender: "Male", doctor: drMehtaId, status: "New" },
  { name: "Ananya Verma", email: "ananya.verma@ayursutra.demo", age: 28, gender: "Female", doctor: drMehtaId, status: "Active" },
  { name: "Arjun Singh", email: "arjun.singh@ayursutra.demo", age: 45, gender: "Male", doctor: drSharmaId, status: "Active" },
  { name: "Priya Gupta", email: "priya.gupta@ayursutra.demo", age: 39, gender: "Female", doctor: drSharmaId, status: "Completed" },
];
const patientIds: Record<string, string> = {};
let codeCounter = 1001;
for (const p of patientDefs) {
  const uid = makeUser(p.name, p.email, "patient");
  const pid = uuid();
  db.prepare(
    `INSERT INTO patients (id, user_id, patient_code, age, gender, assigned_doctor_id, treatment_status) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(pid, uid, "PT" + codeCounter++, p.age, p.gender, p.doctor, p.status);
  patientIds[p.name] = pid;
}

// Helper to format today +/- N days as YYYY-MM-DD
function dateOffset(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// --- Treatment plan for Ananya Verma (already active, with completed + upcoming sessions) ---
const ananyaPlanId = uuid();
db.prepare(
  `INSERT INTO treatment_plans (id, patient_id, doctor_id, plan_name, start_date, end_date, frequency, notes, follow_up_date, status)
   VALUES (?, ?, ?, 'Classical Panchakarma - 7 Day Program', ?, ?, 'Daily', 'Standard 7-day detox program.', ?, 'Active')`
).run(ananyaPlanId, patientIds["Ananya Verma"], drMehtaId, dateOffset(-4), dateOffset(3), dateOffset(10));

db.prepare(
  `INSERT INTO treatment_plan_therapies (id, treatment_plan_id, therapy_id, sequence_order, total_sessions) VALUES (?, ?, ?, 1, 4)`
).run(uuid(), ananyaPlanId, therapyIds["Abhyanga (Therapeutic Oil Massage)"]);
db.prepare(
  `INSERT INTO treatment_plan_therapies (id, treatment_plan_id, therapy_id, sequence_order, total_sessions) VALUES (?, ?, ?, 2, 3)`
).run(uuid(), ananyaPlanId, therapyIds["Shirodhara"]);

// A mix of completed/upcoming appointments for Ananya so dashboards aren't empty
const ananyaSessions = [
  { offset: -4, therapy: "Abhyanga (Therapeutic Oil Massage)", therapist: therapistAId, room: "Room 2", time: "10:00", status: "Completed" },
  { offset: -3, therapy: "Shirodhara", therapist: therapistBId, room: "Room 1", time: "11:00", status: "Completed" },
  { offset: -2, therapy: "Abhyanga (Therapeutic Oil Massage)", therapist: therapistAId, room: "Room 2", time: "10:00", status: "Completed" },
  { offset: -1, therapy: "Shirodhara", therapist: therapistBId, room: "Room 1", time: "11:00", status: "Missed" },
  { offset: 0, therapy: "Abhyanga (Therapeutic Oil Massage)", therapist: therapistAId, room: "Room 2", time: "10:00", status: "Upcoming" },
  { offset: 1, therapy: "Shirodhara", therapist: therapistBId, room: "Room 1", time: "11:00", status: "Upcoming" },
  { offset: 2, therapy: "Abhyanga (Therapeutic Oil Massage)", therapist: therapistAId, room: "Room 2", time: "10:00", status: "Upcoming" },
];
for (const s of ananyaSessions) {
  const therapy = therapies.find((t) => t.name === s.therapy)!;
  const startMin = parseInt(s.time.split(":")[0]) * 60 + parseInt(s.time.split(":")[1]);
  const endMin = startMin + therapy.duration;
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
  db.prepare(
    `INSERT INTO appointments (id, patient_id, therapist_id, doctor_id, therapy_id, treatment_plan_id, room_id, session_date, start_time, end_time, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uuid(),
    patientIds["Ananya Verma"],
    s.therapist,
    drMehtaId,
    therapyIds[s.therapy],
    ananyaPlanId,
    roomIds[s.room],
    dateOffset(s.offset),
    s.time,
    endTime,
    s.status
  );
}

// --- Treatment plan for Arjun Singh (active, ongoing) ---
const arjunPlanId = uuid();
db.prepare(
  `INSERT INTO treatment_plans (id, patient_id, doctor_id, plan_name, start_date, end_date, frequency, notes, follow_up_date, status)
   VALUES (?, ?, ?, 'Basti Therapy Program', ?, ?, 'Alternate days', 'Focused Basti + Swedana program.', ?, 'Active')`
).run(arjunPlanId, patientIds["Arjun Singh"], drSharmaId, dateOffset(-2), dateOffset(5), dateOffset(12));
db.prepare(
  `INSERT INTO treatment_plan_therapies (id, treatment_plan_id, therapy_id, sequence_order, total_sessions) VALUES (?, ?, ?, 1, 3)`
).run(uuid(), arjunPlanId, therapyIds["Basti (Medicated Enema Therapy)"]);

db.prepare(
  `INSERT INTO appointments (id, patient_id, therapist_id, doctor_id, therapy_id, treatment_plan_id, room_id, session_date, start_time, end_time, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, '09:00', '09:45', 'Completed')`
).run(uuid(), patientIds["Arjun Singh"], therapistCId, drSharmaId, therapyIds["Basti (Medicated Enema Therapy)"], arjunPlanId, roomIds["Room 1"], dateOffset(-2));

db.prepare(
  `INSERT INTO appointments (id, patient_id, therapist_id, doctor_id, therapy_id, treatment_plan_id, room_id, session_date, start_time, end_time, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, '09:00', '09:45', 'Upcoming')`
).run(uuid(), patientIds["Arjun Singh"], therapistCId, drSharmaId, therapyIds["Basti (Medicated Enema Therapy)"], arjunPlanId, roomIds["Room 1"], dateOffset(0));

// --- Completed program for Priya Gupta ---
const priyaPlanId = uuid();
db.prepare(
  `INSERT INTO treatment_plans (id, patient_id, doctor_id, plan_name, start_date, end_date, frequency, notes, follow_up_date, status)
   VALUES (?, ?, ?, 'Nasya Therapy - Short Program', ?, ?, 'Daily', 'Completed successfully.', ?, 'Completed')`
).run(priyaPlanId, patientIds["Priya Gupta"], drSharmaId, dateOffset(-14), dateOffset(-8), dateOffset(6));

// --- INTENTIONAL CONFLICT SETUP for Rahul Sharma demo (Step 8 of demo scenario) ---
// Rahul is "New" with no plan yet. We pre-book Therapist A in Room 2 at 10:00-11:00 TODAY
// for a walk-in slot so that when the doctor tries to schedule Rahul's Abhyanga at 10:00 today,
// the Smart Scheduler detects a conflict and proposes alternatives.
db.prepare(
  `INSERT INTO appointments (id, patient_id, therapist_id, doctor_id, therapy_id, treatment_plan_id, room_id, session_date, start_time, end_time, status)
   VALUES (?, ?, ?, ?, ?, NULL, ?, ?, '10:00', '11:00', 'Upcoming')`
).run(uuid(), patientIds["Ananya Verma"], therapistAId, drMehtaId, therapyIds["Abhyanga (Therapeutic Oil Massage)"], roomIds["Room 2"], dateOffset(0));

// --- Sample notifications ---
function notify(userId: string, title: string, message: string, type = "info") {
  db.prepare(`INSERT INTO notifications (id, user_id, title, message, type) VALUES (?, ?, ?, ?, ?)`).run(
    uuid(),
    userId,
    title,
    message,
    type
  );
}
notify(drMehtaUserId, "Scheduling conflict", "Therapist A is unavailable at 10:00 AM today for a new booking.", "warning");
notify(drMehtaUserId, "Missed session", "Ananya Verma missed her Shirodhara session yesterday.", "alert");

console.log("Seed complete.");
console.log("\nDemo credentials (all passwords: demo1234):");
console.log("  Admin:      admin@ayursutra.demo");
console.log("  Doctor:     dr.mehta@ayursutra.demo");
console.log("  Doctor:     dr.sharma@ayursutra.demo");
console.log("  Therapist:  " + therapistNames.map(([n]) => n.split(" - ")[1]).join(", ") + " (see /doctors,/therapists list for exact emails)");
console.log("  Patient:    rahul.sharma@ayursutra.demo, ananya.verma@ayursutra.demo, arjun.singh@ayursutra.demo, priya.gupta@ayursutra.demo");
