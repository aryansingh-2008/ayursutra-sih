import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card } from "../../components/Common";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { X, Plus } from "lucide-react";

export default function CreateTreatmentPlan() {
  const { id: patientId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [therapies, setTherapies] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [planName, setPlanName] = useState("Panchakarma Treatment Plan");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [frequency, setFrequency] = useState("Daily");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<{ therapyId: string; totalSessions: number }[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/therapies").then(setTherapies),
      api.get("/doctors").then((rows) => {
        setDoctors(rows);
        if (user?.doctorId) setSelectedDoctorId(user.doctorId);
      }),
    ]).catch(console.error);
  }, []);

  function addTherapy(therapyId: string) {
    if (selected.find((s) => s.therapyId === therapyId)) return;
    setSelected([...selected, { therapyId, totalSessions: 3 }]);
  }
  function removeTherapy(therapyId: string) {
    setSelected(selected.filter((s) => s.therapyId !== therapyId));
  }
  function updateSessions(therapyId: string, n: number) {
    setSelected(selected.map((s) => (s.therapyId === therapyId ? { ...s, totalSessions: n } : s)));
  }

  async function handleSubmit() {
    setError("");
    if (selected.length === 0) {
      setError("Select at least one therapy for the plan.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/treatment-plans", {
        patientId,
        doctorId: selectedDoctorId || user?.doctorId,
        planName,
        startDate,
        endDate,
        frequency,
        notes,
        therapies: selected,
      });
      nav(`/doctor/scheduler/${res.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell>
      <PageHeader title="Create treatment plan" subtitle="Define therapies and duration — scheduling comes next." />
      <div className="p-8 max-w-3xl space-y-6">
        <Card className="p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Treating doctor</label>
              <select
                value={selectedDoctorId || user?.doctorId || ""}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.specialization ? ` · ${d.specialization}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Plan name</label>
              <input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40"
              >
                <option>Daily</option>
                <option>Alternate days</option>
                <option>Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40"
              placeholder="Optional clinical notes for this plan"
            />
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold text-ink-900 mb-3">Select therapies</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {therapies.map((t) => (
              <button
                key={t.id}
                onClick={() => addTherapy(t.id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-ink-900/15 hover:border-forest-600/40 hover:bg-forest-600/5 px-3 py-1.5 rounded-full transition-colors"
              >
                <Plus size={12} /> {t.name} · {t.default_duration_minutes}m
              </button>
            ))}
          </div>

          {selected.length === 0 ? (
            <p className="text-xs text-ink-500">No therapies selected yet.</p>
          ) : (
            <ul className="space-y-2">
              {selected.map((s) => {
                const t = therapies.find((x) => x.id === s.therapyId);
                return (
                  <li
                    key={s.therapyId}
                    className="flex items-center justify-between bg-sand-100 rounded-lg px-3 py-2.5"
                  >
                    <span className="text-sm text-ink-900">{t?.name}</span>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-ink-500 flex items-center gap-1.5">
                        Sessions
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={s.totalSessions}
                          onChange={(e) => updateSessions(s.therapyId, parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 rounded-md border border-ink-900/15 text-xs"
                        />
                      </label>
                      <button onClick={() => removeTherapy(s.therapyId)} className="text-ink-500 hover:text-rose-500">
                        <X size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {error && <p className="text-sm text-rose-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-3 rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save plan & continue to scheduler"}
        </button>
      </div>
    </Shell>
  );
}
