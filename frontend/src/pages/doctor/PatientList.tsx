import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { EmptyState, Card } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { Search, ChevronRight } from "lucide-react";

export default function PatientList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/patients").then(setPatients).catch(console.error);
  }, []);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) || p.patient_code.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Shell>
      <PageHeader title="Patients" subtitle={`${patients.length} registered patients`} />
      <div className="p-8">
        <div className="relative mb-5 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or patient ID"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40"
          />
        </div>
        <Card>
          {filtered.length === 0 ? (
            <EmptyState title="No patients found" />
          ) : (
            <ul className="divide-y divide-ink-900/10">
              {filtered.map((p) => (
                <li key={p.id}>
                  <Link to={`${p.id}`} className="px-5 py-4 flex items-center justify-between hover:bg-vata-100/50">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-forest-600/10 text-forest-700 flex items-center justify-center text-sm font-semibold font-display">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-ink-900">{p.name}</div>
                        <div className="text-xs text-ink-500">
                          {p.patient_code} · {p.age}y {p.gender} · Dr. {p.doctor_name?.replace("Dr. ", "") || "Unassigned"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.treatment_status} />
                      <ChevronRight size={15} className="text-ink-500" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Shell>
  );
}
