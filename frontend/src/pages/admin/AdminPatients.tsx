import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card, EmptyState } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";

const STATUSES = ["New", "Assessment", "Active", "Paused", "Completed"];

type Patient = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  patient_code: string;
  age?: number;
  gender?: string;
  assigned_doctor_id?: string;
  doctor_name?: string;
  treatment_status: string;
};

type Doctor = { id: string; name: string; specialization?: string };

type FormState = {
  name: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
  assignedDoctorId: string;
  treatmentStatus: string;
  password: string;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  age: "",
  gender: "",
  assignedDoctorId: "",
  treatmentStatus: "New",
  password: "",
};

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadPatients = async () => setPatients(await api.get("/patients"));

  useEffect(() => {
    Promise.all([loadPatients(), api.get("/doctors").then(setDoctors)]).catch((e) => setMessage(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.name, p.email, p.patient_code, p.phone, p.doctor_name].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [patients, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowForm(true);
  };

  const openEdit = (p: Patient) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      email: p.email || "",
      phone: p.phone || "",
      age: p.age == null ? "" : String(p.age),
      gender: p.gender || "",
      assignedDoctorId: p.assigned_doctor_id || "",
      treatmentStatus: p.treatment_status || "New",
      password: "",
    });
    setMessage("");
    setShowForm(true);
  };

  const savePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        assignedDoctorId: form.assignedDoctorId || null,
        treatmentStatus: form.treatmentStatus,
        ...(editingId ? {} : { password: form.password || "welcome123" }),
      };
      if (editingId) await api.put(`/patients/${editingId}`, payload);
      else await api.post("/patients", payload);
      await loadPatients();
      setShowForm(false);
      setMessage(editingId ? "Patient updated successfully." : "Patient added successfully.");
    } catch (e: any) {
      setMessage(e.message || "Could not save patient.");
    } finally {
      setSaving(false);
    }
  };

  const deletePatient = async (p: Patient) => {
    if (!window.confirm(`Delete ${p.name}? This will remove the patient's clinical records and login account.`)) return;
    try {
      await api.delete(`/patients/${p.id}`);
      await loadPatients();
      setMessage(`${p.name} was deleted.`);
    } catch (e: any) {
      setMessage(e.message || "Could not delete patient.");
    }
  };

  const viewPatient = async (p: Patient) => {
    try {
      setViewing(await api.get(`/patients/${p.id}`));
    } catch (e: any) {
      setMessage(e.message || "Could not load patient.");
    }
  };

  return (
    <Shell>
      <PageHeader
        title="Patients"
        subtitle={`${patients.length} registered across the clinic`}
      />
      <div className="p-8 space-y-5">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search size={17} className="absolute left-3 top-3 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, email, phone or doctor..."
              className="w-full rounded-xl border border-ink-900/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-forest-700/20"
            />
          </div>
          <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-800">
            <Plus size={17} /> Add Patient
          </button>
        </div>

        {message && <div className="rounded-xl border border-forest-700/20 bg-forest-50 px-4 py-3 text-sm text-forest-800">{message}</div>}

        <Card>
          {filtered.length === 0 ? (
            <EmptyState title={search ? "No matching patients" : "No patients registered yet"} body={search ? "Try another search term." : "Add your first patient to begin."} />
          ) : (
            <div className="divide-y divide-ink-900/10">
              {filtered.map((p) => (
                <div key={p.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900">{p.name}</div>
                    <div className="text-xs text-ink-500 mt-1">
                      {p.patient_code} · {p.age ?? "—"}y · {p.gender || "—"} · {p.doctor_name || "Unassigned"}
                    </div>
                    <div className="text-xs text-ink-400 mt-1">{p.email}{p.phone ? ` · ${p.phone}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={p.treatment_status} />
                    <button onClick={() => viewPatient(p)} className="inline-flex items-center gap-1 rounded-lg border border-ink-900/10 px-3 py-2 text-xs font-medium hover:bg-vata-50"><Eye size={14} /> View</button>
                    <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 rounded-lg border border-ink-900/10 px-3 py-2 text-xs font-medium hover:bg-vata-50"><Pencil size={14} /> Edit</button>
                    <button onClick={() => deletePatient(p)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto">
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-900/10 px-6 py-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-900">{editingId ? "Edit Patient" : "Add Patient"}</h2>
                <p className="text-xs text-ink-500 mt-1">Patient information used for care coordination and scheduling.</p>
              </div>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={savePatient} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" required type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
              <SelectField label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={["Male", "Female", "Other"]} placeholder="Select gender" />
              <SelectField label="Assigned doctor" value={form.assignedDoctorId} onChange={(v) => setForm({ ...form, assignedDoctorId: v })} options={doctors.map((d) => d.id)} labels={Object.fromEntries(doctors.map((d) => [d.id, `${d.name}${d.specialization ? ` · ${d.specialization}` : ""}`]))} placeholder="Unassigned" />
              {editingId ? (
                <SelectField label="Treatment status" value={form.treatmentStatus} onChange={(v) => setForm({ ...form, treatmentStatus: v })} options={STATUSES} />
              ) : (
                <Field label="Temporary password" type="password" placeholder="Default: welcome123" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              )}
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-ink-900/10 mt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-ink-900/10 px-4 py-2.5 text-sm">Cancel</button>
                <button disabled={saving} className="rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving..." : editingId ? "Update Patient" : "Save Patient"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto" onClick={() => setViewing(null)}>
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-900/10 px-6 py-4">
              <div><h2 className="font-display text-xl font-semibold text-ink-900">{viewing.name}</h2><p className="text-xs text-ink-500">{viewing.patient_code}</p></div>
              <button onClick={() => setViewing(null)}><X size={20} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              <Info label="Email" value={viewing.email} /><Info label="Phone" value={viewing.phone || "—"} />
              <Info label="Age" value={viewing.age == null ? "—" : `${viewing.age} years`} /><Info label="Gender" value={viewing.gender || "—"} />
              <Info label="Doctor" value={viewing.doctor_name || "Unassigned"} /><Info label="Status" value={viewing.treatment_status} />
              <Info label="Treatment plans" value={String(viewing.plans?.length || 0)} /><Info label="Appointments" value={String(viewing.appointments?.length || 0)} />
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return <label className="block text-sm"><span className="block text-xs font-medium text-ink-700 mb-1.5">{label}{required ? " *" : ""}</span><input required={required} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-ink-900/10 px-3 py-2.5 outline-none focus:ring-2 focus:ring-forest-700/20" /></label>;
}

function SelectField({ label, value, onChange, options, labels, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string>; placeholder?: string }) {
  return <label className="block text-sm"><span className="block text-xs font-medium text-ink-700 mb-1.5">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-ink-900/10 px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-forest-700/20"><option value="">{placeholder || "Select"}</option>{options.map((o) => <option key={o} value={o}>{labels?.[o] || o}</option>)}</select></label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-vata-50 p-3"><div className="text-[11px] uppercase tracking-wide text-ink-400">{label}</div><div className="mt-1 font-medium text-ink-900">{value}</div></div>;
}
