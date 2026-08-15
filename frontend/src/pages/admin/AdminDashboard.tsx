import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { StatCard, Card, EmptyState } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api.get("/analytics").then(setAnalytics).catch(console.error);
    api.get(`/appointments?date=${today}`).then(setAppts).catch(console.error);
  }, []);

  return (
    <Shell>
      <PageHeader title="Admin dashboard" subtitle="Clinic-wide overview" />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total patients" value={analytics?.totalPatients ?? "—"} />
          <StatCard label="Active plans" value={analytics?.activePlans ?? "—"} />
          <StatCard label="Today's therapies" value={analytics?.todayTherapies ?? "—"} />
          <StatCard label="Missed sessions" value={analytics?.missed ?? "—"} />
        </div>

        <Card>
          <div className="px-5 py-4 border-b border-ink-900/10">
            <h2 className="font-semibold text-ink-900 text-sm">Today's sessions across the clinic</h2>
          </div>
          {appts.length === 0 ? (
            <EmptyState title="No appointments today" />
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {appts.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-ink-900">{a.patient_name} · {a.therapy_name}</div>
                    <div className="text-xs text-ink-500">{a.start_time} · {a.therapist_name} · {a.room_name}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
