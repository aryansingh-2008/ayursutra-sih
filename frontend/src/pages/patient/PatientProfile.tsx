import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card } from "../../components/Common";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";

export default function PatientProfile() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    if (user?.patientId) api.get(`/patients/${user.patientId}`).then(setPatient).catch(console.error);
  }, [user]);

  if (!patient) return <Shell><div className="p-8 text-sm text-ink-500">Loading…</div></Shell>;

  const rows: [string, string][] = [
    ["Patient ID", patient.patient_code],
    ["Name", patient.name],
    ["Age", String(patient.age)],
    ["Gender", patient.gender],
    ["Email", patient.email],
    ["Phone", patient.phone || "—"],
    ["Assigned doctor", patient.doctor_name || "Unassigned"],
    ["Registered", patient.registration_date?.slice(0, 10)],
    ["Treatment status", patient.treatment_status],
  ];

  return (
    <Shell>
      <PageHeader title="Profile" subtitle="Your personal and treatment details" />
      <div className="p-8 max-w-lg">
        <Card>
          <ul className="divide-y divide-ink-900/10">
            {rows.map(([label, value]) => (
              <li key={label} className="px-5 py-3 flex items-center justify-between text-sm">
                <span className="text-ink-500">{label}</span>
                <span className="font-medium text-ink-900">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Shell>
  );
}
