import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card, EmptyState } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { CheckCircle2, XCircle } from "lucide-react";

export default function TherapistDashboard() {
  const [appts, setAppts] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  function load() {
    api.get(`/appointments?date=${today}`).then(setAppts).catch(console.error);
  }

  useEffect(load, []);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    try {
      await api.put(`/appointments/${id}`, { status, sessionNotes: notes[id] });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Shell>
      <PageHeader title="Today's sessions" subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} />
      <div className="p-8">
        <Card>
          {appts.length === 0 ? (
            <EmptyState title="No sessions today" body="You have no therapy sessions scheduled for today." />
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {appts.map((a) => (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-ink-900">
                        {a.start_time} · {a.patient_name}
                      </div>
                      <div className="text-xs text-ink-500">
                        {a.therapy_name} · {a.room_name}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  {a.status === "Upcoming" || a.status === "In Progress" ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        placeholder="Session notes (optional)"
                        value={notes[a.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-md border border-ink-900/15 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600/40"
                      />
                      <button
                        disabled={busy === a.id}
                        onClick={() => updateStatus(a.id, "Completed")}
                        className="inline-flex items-center gap-1 text-xs font-medium bg-forest-600 hover:bg-forest-700 text-white px-3 py-1.5 rounded-md transition-colors"
                      >
                        <CheckCircle2 size={13} /> Complete
                      </button>
                      <button
                        disabled={busy === a.id}
                        onClick={() => updateStatus(a.id, "Missed")}
                        className="inline-flex items-center gap-1 text-xs font-medium border border-ink-900/15 hover:bg-rose-500/5 hover:text-rose-500 text-ink-700 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <XCircle size={13} /> Mark missed
                      </button>
                    </div>
                  ) : (
                    a.session_notes && <p className="text-xs text-ink-500 mt-1">Note: {a.session_notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
