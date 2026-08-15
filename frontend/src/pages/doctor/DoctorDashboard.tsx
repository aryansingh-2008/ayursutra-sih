import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { StatCard, EmptyState, Card } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { ChevronRight } from "lucide-react";
import AssistantBrief from "../../components/AssistantBrief";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api.get("/patients").then(setPatients).catch(console.error);
    api.get(`/appointments?date=${today}`).then(setTodayAppts).catch(console.error);
    api.get("/analytics").then(setAnalytics).catch(console.error);
  }, []);

  const myPatients = patients.filter((p) => p.doctor_name === user?.name);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  useEffect(() => {
    if (!selectedPatientId && myPatients.length > 0) setSelectedPatientId(myPatients[0].id);
  }, [myPatients, selectedPatientId]);

  return (
    <Shell>
      <PageHeader title={`Welcome back, ${user?.name}`} subtitle="Here's what's happening across your patients today." />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="My patients" value={myPatients.length} />
          <StatCard label="Today's therapies" value={analytics?.todayTherapies ?? "—"} />
          <StatCard label="Active plans" value={analytics?.activePlans ?? "—"} />
          <StatCard label="Missed sessions" value={analytics?.missed ?? "—"} />
        </div>

        <div className="grid lg:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Assistant patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full max-w-md px-3 py-2.5 rounded-lg border border-ink-900/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            >
              {myPatients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.patient_code}</option>)}
            </select>
          </div>
        </div>

        <AssistantBrief patientId={selectedPatientId} />

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <div className="px-5 py-4 border-b border-ink-900/10 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900 text-sm">Today's schedule</h2>
              <Link to="/doctor/calendar" className="text-xs text-forest-700 font-medium hover:underline">
                View calendar
              </Link>
            </div>
            {todayAppts.length === 0 ? (
              <EmptyState title="No appointments today" body="Nothing scheduled for today across the clinic." />
            ) : (
              <ul className="divide-y divide-ink-900/10">
                {todayAppts.slice(0, 6).map((a) => (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-ink-900">{a.patient_name}</div>
                      <div className="text-xs text-ink-500">
                        {a.therapy_name} · {a.start_time} · {a.therapist_name}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-ink-900/10 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900 text-sm">My patients</h2>
              <Link to="/doctor/patients" className="text-xs text-forest-700 font-medium hover:underline">
                View all
              </Link>
            </div>
            {myPatients.length === 0 ? (
              <EmptyState title="No patients assigned yet" />
            ) : (
              <ul className="divide-y divide-ink-900/10">
                {myPatients.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/doctor/patients/${p.id}`}
                      className="px-5 py-3 flex items-center justify-between text-sm hover:bg-vata-100/50"
                    >
                      <div>
                        <div className="font-medium text-ink-900">{p.name}</div>
                        <div className="text-xs text-ink-500">
                          {p.patient_code} · {p.age}y {p.gender}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.treatment_status} />
                        <ChevronRight size={15} className="text-ink-500" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Shell>
  );
}
