import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card, EmptyState } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";

export default function PatientSchedule() {
  const [appts, setAppts] = useState<any[]>([]);
  useEffect(() => {
    api.get("/appointments").then(setAppts).catch(console.error);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = appts.filter((a) => a.session_date >= today).sort((a, b) => (a.session_date + a.start_time).localeCompare(b.session_date + b.start_time));
  const past = appts.filter((a) => a.session_date < today).sort((a, b) => (b.session_date + b.start_time).localeCompare(a.session_date + a.start_time));

  return (
    <Shell>
      <PageHeader title="My schedule" subtitle="Upcoming sessions and therapy history" />
      <div className="p-8 space-y-6 max-w-2xl">
        <Card>
          <div className="px-5 py-4 border-b border-ink-900/10">
            <h2 className="font-semibold text-ink-900 text-sm">Upcoming</h2>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming sessions" />
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {upcoming.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-ink-900">{a.therapy_name}</div>
                    <div className="text-xs text-ink-500">{a.session_date} · {a.start_time} · {a.therapist_name.split(" - ")[1] || a.therapist_name} · {a.room_name}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-ink-900/10">
            <h2 className="font-semibold text-ink-900 text-sm">Therapy history</h2>
          </div>
          {past.length === 0 ? (
            <EmptyState title="No past sessions yet" />
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {past.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-ink-900">{a.therapy_name}</div>
                    <div className="text-xs text-ink-500">{a.session_date} · {a.start_time}</div>
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
