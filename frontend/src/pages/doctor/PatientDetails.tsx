import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card, EmptyState } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { Plus, BrainCircuit } from "lucide-react";

const TIMELINE_STAGES = ["New", "Assessment", "Active", "Completed"];

export default function PatientDetails() {
  const { id } = useParams();
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    if (id) api.get(`/patients/${id}`).then(setPatient).catch(console.error);
  }, [id]);

  if (!patient) return <Shell><div className="p-8 text-sm text-ink-500">Loading…</div></Shell>;

  const stageIndex = Math.max(TIMELINE_STAGES.indexOf(patient.treatment_status), 0);

  return (
    <Shell>
      <PageHeader
        title={patient.name}
        subtitle={`${patient.patient_code} · ${patient.age}y ${patient.gender} · Registered ${patient.registration_date?.slice(0, 10)}`}
        action={
          <div className="flex items-center gap-2">
          <Link
            to={`/doctor/ai-copilot?patientId=${id}`}
            className="inline-flex items-center gap-2 border border-ink-900/10 bg-white hover:bg-vata-50 text-ink-800 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <BrainCircuit size={15} /> AI Copilot
          </Link>
          <Link
            to={`/doctor/patients/${id}/new-plan`}
            className="inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={15} /> Create treatment plan
          </Link>
          </div>
        }
      />

      <div className="p-8 space-y-6">
        {/* Journey timeline */}
        <Card className="p-6">
          <p className="text-xs font-mono-num uppercase tracking-widest text-ink-500 mb-5">Treatment journey</p>
          <div className="flex items-center">
            {TIMELINE_STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      i <= stageIndex ? "bg-forest-600 ring-4 ring-forest-600/15" : "bg-ink-900/10"
                    }`}
                  />
                  <span className={`text-xs font-medium ${i <= stageIndex ? "text-ink-900" : "text-ink-500"}`}>
                    {stage}
                  </span>
                </div>
                {i < TIMELINE_STAGES.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${i < stageIndex ? "bg-forest-600" : "bg-ink-900/10"}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <div className="px-5 py-4 border-b border-ink-900/10">
              <h2 className="font-semibold text-ink-900 text-sm">Treatment plans</h2>
            </div>
            {patient.plans?.length === 0 ? (
              <EmptyState title="No treatment plan has been created yet." />
            ) : (
              <ul className="divide-y divide-ink-900/10">
                {patient.plans.map((plan: any) => (
                  <li key={plan.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink-900">{plan.plan_name}</span>
                      <StatusBadge status={plan.status} />
                    </div>
                    <div className="text-xs text-ink-500">
                      {plan.start_date} → {plan.end_date} · {plan.frequency}
                    </div>
                    {plan.status === "Draft" && (
                      <Link
                        to={`/doctor/scheduler/${plan.id}`}
                        className="inline-block mt-2 text-xs font-medium text-forest-700 hover:underline"
                      >
                        Generate Smart Schedule →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-ink-900/10">
              <h2 className="font-semibold text-ink-900 text-sm">Session history</h2>
            </div>
            {patient.appointments?.length === 0 ? (
              <EmptyState title="No sessions scheduled yet" />
            ) : (
              <ul className="divide-y divide-ink-900/10 max-h-96 overflow-y-auto">
                {patient.appointments.map((a: any) => (
                  <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-ink-900">{a.therapy_name}</div>
                      <div className="text-xs text-ink-500">
                        {a.session_date} · {a.start_time} · {a.therapist_name} · {a.room_name}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <div className="px-5 py-4 border-b border-ink-900/10">
            <h2 className="font-semibold text-ink-900 text-sm">Progress notes</h2>
          </div>
          {patient.progress?.length === 0 ? (
            <EmptyState title="No progress recorded yet" />
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {patient.progress.map((pr: any) => (
                <li key={pr.id} className="px-5 py-3 text-sm">
                  <div className="text-ink-900">{pr.note}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{pr.created_at}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
