import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card } from "../../components/Common";
import { api } from "../../lib/api";
import { AlertTriangle, CheckCircle2, Sparkles, Calendar, Clock, User, MapPin } from "lucide-react";

export default function SmartScheduler() {
  const { planId } = useParams();
  const nav = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [draft, setDraft] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [conflictCheck, setConflictCheck] = useState<any>(null);

  useEffect(() => {
    if (planId) api.get(`/treatment-plans/${planId}`).then(setPlan).catch(console.error);
  }, [planId]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await api.post("/scheduler/generate", { treatmentPlanId: planId });
      setDraft(res);

      // Also run an explicit conflict check for the first therapy at a busy time,
      // to surface a clear conflict card if the first pass had to route around one.
      if (res.schedule?.length > 0 && plan?.patient_id) {
        const first = res.schedule[0];
        const check = await api.post("/scheduler/check-conflict", {
          patientId: plan.patient_id,
          therapyId: first.therapyId,
          preferredDate: first.date,
          preferredStartTime: "10:00",
        });
        if (check.conflict) setConflictCheck(check);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function approve() {
    if (!draft || !plan) return;
    setApproving(true);
    setError("");
    try {
      await api.post("/scheduler/approve", {
        treatmentPlanId: planId,
        patientId: plan.patient_id,
        doctorId: plan.doctor_id,
        schedule: draft.schedule,
      });
      nav(`/doctor/patients/${plan.patient_id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  }

  if (!plan) return <Shell><div className="p-8 text-sm text-ink-500">Loading…</div></Shell>;

  return (
    <Shell>
      <PageHeader title="Smart Scheduler" subtitle={plan.plan_name} />
      <div className="p-8 space-y-6 max-w-4xl">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-900">
              {plan.start_date} → {plan.end_date} · {plan.frequency}
            </p>
            <p className="text-xs text-ink-500 mt-1">
              {plan.therapies?.length} therapy type(s) · checks therapist, room and patient availability together
            </p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Sparkles size={15} /> {generating ? "Generating…" : "Generate Smart Schedule"}
          </button>
        </Card>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/20 text-rose-600 text-sm px-4 py-3 rounded-lg">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {conflictCheck && (
          <div className="bg-clay-500/5 border border-clay-500/25 rounded-xl p-5">
            <div className="flex items-center gap-2 text-clay-600 font-medium text-sm mb-1">
              <AlertTriangle size={16} /> Scheduling conflict detected
            </div>
            <p className="text-sm text-ink-700 mb-3">{conflictCheck.reason}</p>
            <p className="text-xs font-medium text-ink-500 mb-2">Suggested alternative slots</p>
            <div className="flex flex-wrap gap-2">
              {conflictCheck.suggestions.map((s: any, i: number) => (
                <span key={i} className="text-xs bg-white border border-ink-900/10 rounded-full px-3 py-1.5 text-ink-700">
                  {s.startTime}–{s.endTime} · {s.therapistName.split(" - ")[1] || s.therapistName} · {s.roomName}
                </span>
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-3">
              The scheduler automatically routed around this conflict in the draft below — review before approving.
            </p>
          </div>
        )}

        {draft && (
          <Card>
            <div className="px-5 py-4 border-b border-ink-900/10 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900 text-sm">
                Draft schedule — {draft.totalDays} day{draft.totalDays !== 1 ? "s" : ""}
              </h2>
              {draft.unscheduled > 0 && (
                <span className="text-xs text-clay-600 font-medium">{draft.unscheduled} session(s) could not be placed</span>
              )}
            </div>
            <ul className="divide-y divide-ink-900/10">
              {draft.schedule.map((s: any, i: number) => (
                <li key={i} className="px-5 py-3.5 flex items-center gap-6 text-sm">
                  <span className="w-14 font-mono-num text-ink-500 text-xs">Day {s.day}</span>
                  <span className="flex-1 font-medium text-ink-900">{s.therapyName}</span>
                  <span className="flex items-center gap-1.5 text-ink-700 text-xs w-28">
                    <Calendar size={13} /> {s.date}
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-700 text-xs w-24">
                    <Clock size={13} /> {s.startTime}
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-700 text-xs w-40">
                    <User size={13} /> {s.therapistName.split(" - ")[1] || s.therapistName}
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-700 text-xs w-24">
                    <MapPin size={13} /> {s.roomName}
                  </span>
                </li>
              ))}
            </ul>
            <div className="px-5 py-4 border-t border-ink-900/10 flex items-center justify-between">
              <p className="text-xs text-ink-500">Doctor review required before this schedule goes live for the patient.</p>
              <button
                onClick={approve}
                disabled={approving}
                className="inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <CheckCircle2 size={15} /> {approving ? "Approving…" : "Approve schedule"}
              </button>
            </div>
          </Card>
        )}
      </div>
    </Shell>
  );
}
