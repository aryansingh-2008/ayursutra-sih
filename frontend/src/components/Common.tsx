import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-ink-900/10 rounded-xl p-5">
      <div className="text-xs font-medium text-ink-500 mb-2">{label}</div>
      <div className="font-display text-3xl font-semibold text-ink-900">{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-1">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title, body, icon }: { title: string; body?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-11 h-11 rounded-full bg-vata-100 flex items-center justify-center mb-3 text-ink-500">
        {icon || <Inbox size={18} />}
      </div>
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {body && <p className="text-xs text-ink-500 mt-1 max-w-xs">{body}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white border border-ink-900/10 rounded-xl ${className}`}>{children}</div>;
}
