import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card, EmptyState } from "../../components/Common";
import { api } from "../../lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}
function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarView() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [appts, setAppts] = useState<any[]>([]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    const from = fmt(days[0]);
    const to = fmt(days[6]);
    api.get(`/appointments?from=${from}&to=${to}`).then(setAppts).catch(console.error);
  }, [weekStart.getTime()]);

  function shiftWeek(delta: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(startOfWeek(d));
  }

  return (
    <Shell>
      <PageHeader
        title="Calendar"
        subtitle="Week view of all scheduled therapy sessions"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => shiftWeek(-1)} className="p-2 rounded-lg border border-ink-900/15 hover:bg-vata-100">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-ink-700 w-32 text-center">
              {days[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
              {days[6].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <button onClick={() => shiftWeek(1)} className="p-2 rounded-lg border border-ink-900/15 hover:bg-vata-100">
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />
      <div className="p-8">
        <div className="grid grid-cols-7 gap-3">
          {days.map((d) => {
            const dateStr = fmt(d);
            const dayAppts = appts.filter((a) => a.session_date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isToday = dateStr === fmt(new Date());
            return (
              <Card key={dateStr} className={`p-3 min-h-64 ${isToday ? "ring-2 ring-forest-600/40" : ""}`}>
                <div className="text-xs font-medium text-ink-500 mb-1">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </div>
                <div className="text-lg font-display font-semibold text-ink-900 mb-3">{d.getDate()}</div>
                <div className="space-y-1.5">
                  {dayAppts.map((a) => (
                    <div
                      key={a.id}
                      className={`text-xs rounded-md px-2 py-1.5 border ${
                        a.status === "Missed"
                          ? "bg-rose-500/5 border-rose-500/20 text-rose-600"
                          : a.status === "Completed"
                          ? "bg-forest-600/5 border-forest-600/20 text-forest-700"
                          : "bg-sand-100 border-ink-900/10 text-ink-700"
                      }`}
                    >
                      <div className="font-medium">{a.start_time} {a.patient_name}</div>
                      <div className="opacity-80">{a.therapy_name}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
        {appts.length === 0 && <div className="mt-6"><EmptyState title="No sessions this week" /></div>}
      </div>
    </Shell>
  );
}
