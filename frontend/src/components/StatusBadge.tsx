const STYLES: Record<string, string> = {
  Upcoming: "bg-sand-100 text-ink-700 ring-1 ring-ink-500/20",
  "In Progress": "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  Completed: "bg-forest-600/10 text-forest-700 ring-1 ring-forest-600/25",
  Missed: "bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/25",
  Rescheduled: "bg-clay-500/10 text-clay-600 ring-1 ring-clay-500/25",
  Cancelled: "bg-ink-500/10 text-ink-500 ring-1 ring-ink-500/20",
  Active: "bg-forest-600/10 text-forest-700 ring-1 ring-forest-600/25",
  Draft: "bg-sand-100 text-ink-700 ring-1 ring-ink-500/20",
  Paused: "bg-clay-500/10 text-clay-600 ring-1 ring-clay-500/25",
  New: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  Assessment: "bg-clay-500/10 text-clay-600 ring-1 ring-clay-500/25",
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] || "bg-ink-500/10 text-ink-700 ring-1 ring-ink-500/20";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>{status}</span>
  );
}
