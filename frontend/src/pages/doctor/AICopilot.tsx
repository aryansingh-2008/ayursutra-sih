import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BrainCircuit, ShieldCheck, Sparkles, TrendingUp, Bot, UserCheck } from "lucide-react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card } from "../../components/Common";
import { api } from "../../lib/api";

type Patient = { id: string; name: string; patient_code: string };

export default function AICopilot() {
  const [params] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState(params.get("patientId") || "");
  const [symptoms, setSymptoms] = useState("");
  const [goals, setGoals] = useState("");
  const [preferredTherapy, setPreferredTherapy] = useState("");
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/patients").then(setPatients).catch((e: any) => setError(e.message));
  }, []);

  async function recommend() {
    if (!patientId) {
      setError("Select a patient first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Keep the recommendation and progress calls independent.
      // A temporary failure in one must not blank the whole Copilot screen.
      const r = await api.post("/ai/recommendation", { patientId, symptoms, goals, preferredTherapy });
      setResult(r);

      try {
        const p = await api.get(`/ai/progress/${patientId}`);
        setProgress(p);
      } catch (progressError: any) {
        console.warn("Progress insight unavailable:", progressError);
        setProgress(null);
      }
    } catch (e: any) {
      setError(e.message || "AI Copilot is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <PageHeader title="AI Clinical Copilot" subtitle="Explainable decision support for care coordination and treatment planning." />
      <div className="p-8 space-y-6 max-w-6xl">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-forest-600/10 flex items-center justify-center text-forest-700"><BrainCircuit size={21} /></div>
            <div>
              <h2 className="font-semibold text-ink-900">Assessment → recommendation</h2>
              <p className="text-xs text-ink-500">Ranks configured clinic therapies; the clinician remains the decision maker.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="block text-xs font-medium mb-1.5">Patient</span>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full rounded-xl border border-ink-900/10 px-3 py-2.5 bg-white">
                <option value="">Select patient</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.patient_code}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="block text-xs font-medium mb-1.5">Preferred therapy (optional)</span>
              <input value={preferredTherapy} onChange={(e) => setPreferredTherapy(e.target.value)} placeholder="e.g. Abhyanga" className="w-full rounded-xl border border-ink-900/10 px-3 py-2.5" />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-xs font-medium mb-1.5">Clinician-entered assessment context</span>
              <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3} placeholder="Enter symptoms, observations or assessment context..." className="w-full rounded-xl border border-ink-900/10 px-3 py-2.5" />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="block text-xs font-medium mb-1.5">Care goals / constraints</span>
              <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} placeholder="Enter goals, preferences or scheduling constraints..." className="w-full rounded-xl border border-ink-900/10 px-3 py-2.5" />
            </label>
          </div>
          {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <button onClick={recommend} disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">
            <Sparkles size={16} />{busy ? "Analyzing..." : "Generate explainable recommendation"}
          </button>
        </Card>

        {result && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-ink-900">Ranked options</h2>
                  <span className="text-[11px] rounded-full bg-vata-100 px-3 py-1 text-ink-600">{result.aiMode === "llm" ? "LLM-assisted" : "Local AI fallback"}</span>
                </div>
                <div className="space-y-3">
                  {result.recommendations.map((r: any) => (
                    <div key={r.therapyId} className="rounded-xl border border-ink-900/10 p-4">
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="font-medium text-ink-900">#{r.rank} {r.therapyName}</div>
                          <div className="text-xs text-ink-500 mt-1">{r.reasons.join(" · ")}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-forest-700">{r.score}%</div>
                          <div className="text-[10px] text-ink-400">fit signal</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mb-4 rounded-xl bg-sand-50 border border-ink-900/10 p-3 text-xs text-ink-600">
                  <span className="font-semibold">Engine:</span> {result.serviceStatus === "llm-assisted" ? "Live LLM + local safety rules" : "Local explainable engine"}
                </div>
                {result.aiExplanation && (
                  <div className="mt-5 rounded-xl bg-forest-50 border border-forest-700/15 p-4 text-sm text-ink-800">
                    <div className="flex items-center gap-2 font-semibold mb-2"><Bot size={15} /> AI explanation</div>
                    <div className="whitespace-pre-wrap leading-6">{result.aiExplanation}</div>
                  </div>
                )}
                <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
                  <ShieldCheck size={15} className="inline mr-2" />{result.safetyFlags.join(" ")}
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ink-500"><UserCheck size={14} /> Doctor review and approval required before use.</div>
                <p className="mt-2 text-[11px] text-ink-400">{result.disclaimer}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4"><TrendingUp size={17} className="text-forest-700" /><h2 className="font-semibold text-ink-900">Progress insight</h2></div>
                {progress ? (
                  <>
                    <div className="text-4xl font-display font-semibold text-ink-900">{progress.completionRate}%</div>
                    <div className="text-xs text-ink-500 mt-1">Recorded session completion</div>
                    <div className="mt-5 grid grid-cols-3 gap-2"><Mini label="Total" value={progress.total} /><Mini label="Done" value={progress.completed} /><Mini label="Missed" value={progress.missed} /></div>
                    <div className="mt-5 rounded-xl bg-vata-50 p-4 text-sm text-ink-700">{progress.insight}</div>
                    <p className="mt-4 text-[11px] text-ink-400">{progress.disclaimer}</p>
                  </>
                ) : (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">Progress insight is temporarily unavailable. The recommendation above is still available for clinician review.</div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-ink-900/10 p-3 text-center"><div className="text-lg font-semibold">{value}</div><div className="text-[10px] text-ink-400">{label}</div></div>;
}
