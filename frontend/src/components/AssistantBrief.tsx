import { useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { Card } from "./Common";

export default function AssistantBrief({ patientId }: { patientId?: string }) {
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!patientId) return;
    setLoading(true);
    setError("");
    try {
      setBrief(await api.get(`/assistant/patient/${patientId}`));
    } catch (e: any) {
      setError(e.message || "Unable to generate brief");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-900/10 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-forest-600" />
            <h2 className="font-semibold text-ink-900 text-sm">AyurSutra Assistant</h2>
          </div>
          <p className="text-xs text-ink-500 mt-1">Explainable care-coordination summary from existing records.</p>
        </div>
        <button
          onClick={generate}
          disabled={!patientId || loading}
          className="shrink-0 inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg"
        >
          <Sparkles size={13} /> {loading ? "Preparing…" : "Generate brief"}
        </button>
      </div>

      {!patientId && <div className="p-5 text-xs text-ink-500">Select a patient above to generate a clinician-reviewed operational brief.</div>}
      {error && <div className="p-5 text-sm text-rose-600">{error}</div>}
      {brief && (
        <div className="p-5 space-y-4">
          <p className="text-sm text-ink-800 leading-6">{brief.summary}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-vata-50 border border-ink-900/10 p-3">
              <p className="text-[11px] uppercase tracking-wider text-ink-500">Completion</p>
              <p className="text-xl font-semibold text-ink-900 mt-1">{brief.completionRate}%</p>
            </div>
            <div className="rounded-xl bg-vata-50 border border-ink-900/10 p-3">
              <p className="text-[11px] uppercase tracking-wider text-ink-500">Next session</p>
              {brief.nextSession ? (
                <p className="text-sm font-medium text-ink-900 mt-1 flex items-center gap-1.5"><CalendarClock size={14} /> {brief.nextSession.session_date} · {brief.nextSession.start_time}</p>
              ) : <p className="text-sm text-ink-500 mt-1">None scheduled</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-700 mb-2">Attention points</p>
            <div className="space-y-2">
              {brief.attention.map((item: string, i: number) => (
                <div key={i} className="flex gap-2 text-xs text-ink-700">
                  {item.includes("No operational") ? <CheckCircle2 size={14} className="text-forest-600 shrink-0" /> : <AlertCircle size={14} className="text-clay-600 shrink-0" />}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-ink-500 border-t border-ink-900/10 pt-3">{brief.disclaimer}</p>
        </div>
      )}
    </Card>
  );
}
