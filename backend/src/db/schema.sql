-- AyurSutra database schema (SQLite for prototype; maps 1:1 to a PostgreSQL schema)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','doctor','therapist','patient')),
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  specialization TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS therapists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  specialization TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  patient_code TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  assigned_doctor_id TEXT REFERENCES doctors(id),
  registration_date TEXT DEFAULT (datetime('now')),
  treatment_status TEXT DEFAULT 'New' CHECK (treatment_status IN ('New','Assessment','Active','Paused','Completed')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS therapies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  default_duration_minutes INTEGER NOT NULL,
  required_room_type TEXT,
  assigned_therapist_type TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  room_type TEXT,
  status TEXT DEFAULT 'Available' CHECK (status IN ('Available','Maintenance'))
);

CREATE TABLE IF NOT EXISTS treatment_plans (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  doctor_id TEXT NOT NULL REFERENCES doctors(id),
  plan_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  frequency TEXT,
  notes TEXT,
  follow_up_date TEXT,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft','Active','Paused','Completed','Cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS treatment_plan_therapies (
  id TEXT PRIMARY KEY,
  treatment_plan_id TEXT NOT NULL REFERENCES treatment_plans(id),
  therapy_id TEXT NOT NULL REFERENCES therapies(id),
  sequence_order INTEGER,
  total_sessions INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS therapist_availability (
  id TEXT PRIMARY KEY,
  therapist_id TEXT NOT NULL REFERENCES therapists(id),
  day_of_week INTEGER NOT NULL, -- 0=Sun..6=Sat
  start_time TEXT NOT NULL,     -- 'HH:MM'
  end_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  therapist_id TEXT NOT NULL REFERENCES therapists(id),
  doctor_id TEXT REFERENCES doctors(id),
  therapy_id TEXT NOT NULL REFERENCES therapies(id),
  treatment_plan_id TEXT REFERENCES treatment_plans(id),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  session_date TEXT NOT NULL,   -- 'YYYY-MM-DD'
  start_time TEXT NOT NULL,     -- 'HH:MM'
  end_time TEXT NOT NULL,
  status TEXT DEFAULT 'Upcoming' CHECK (status IN ('Upcoming','In Progress','Completed','Missed','Rescheduled','Cancelled')),
  session_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS progress_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  treatment_plan_id TEXT REFERENCES treatment_plans(id),
  appointment_id TEXT REFERENCES appointments(id),
  note TEXT,
  recorded_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  appointment_id TEXT REFERENCES appointments(id),
  rating INTEGER,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments(session_date);
CREATE INDEX IF NOT EXISTS idx_appt_therapist ON appointments(therapist_id, session_date);
CREATE INDEX IF NOT EXISTS idx_appt_room ON appointments(room_id, session_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments(patient_id, session_date);
