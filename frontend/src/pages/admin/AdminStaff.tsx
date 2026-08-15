import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card, EmptyState } from "../../components/Common";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { Pencil, Plus, Search, Trash2, UserCog, X } from "lucide-react";

type StaffRole = "admin" | "doctor" | "therapist";

type Staff = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: StaffRole;
  specialization?: string | null;
  profileId?: string | null;
  createdAt?: string;
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "welcome123",
  role: "doctor" as StaffRole,
  specialization: "",
};

const roleLabels: Record<StaffRole, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  therapist: "Therapist",
};

export default function AdminStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadStaff() {
    setLoading(true);
    try {
      setStaff(await api.get("/staff"));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) =>
      [s.name, s.email, s.phone, s.role, s.specialization]
        .some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [staff, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openEdit(member: Staff) {
    setEditing(member);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || "",
      password: "",
      role: member.role,
      specialization: member.specialization || "",
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password || undefined,
        role: form.role,
        specialization: form.role === "admin" ? "" : form.specialization,
      };

      if (editing) {
        await api.put(`/staff/${editing.id}`, payload);
        setMessage("Staff member updated successfully.");
      } else {
        await api.post("/staff", payload);
        setMessage("Staff member added successfully.");
      }

      setShowForm(false);
      await loadStaff();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeStaff(member: Staff) {
    if (member.id === user?.id) return;
    const ok = window.confirm(`Delete ${member.name}? This cannot be undone.`);
    if (!ok) return;

    setError("");
    setMessage("");
    try {
      await api.delete(`/staff/${member.id}`);
      setMessage(`${member.name} was removed.`);
      await loadStaff();
    } catch (e: any) {
      setError(e.message);
    }
  }

  const counts = {
    admin: staff.filter((s) => s.role === "admin").length,
    doctor: staff.filter((s) => s.role === "doctor").length,
    therapist: staff.filter((s) => s.role === "therapist").length,
  };

  return (
    <Shell>
      <PageHeader
        title="Staff Management"
        subtitle="Manage administrators, doctors and therapists from one place."
      />

      <div className="p-8 space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["admin", "doctor", "therapist"] as StaffRole[]).map((role) => (
            <Card key={role} className="p-5">
              <p className="text-xs text-ink-500">{roleLabels[role]}s</p>
              <p className="text-2xl font-semibold text-ink-900 mt-1">{counts[role]}</p>
            </Card>
          ))}
        </div>

        {message && (
          <div className="rounded-lg bg-forest-600/10 border border-forest-600/20 px-4 py-3 text-sm text-forest-700">
            {message}
          </div>
        )}

        {error && !showForm && (
          <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        )}

        <Card>
          <div className="p-5 border-b border-ink-900/10 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Team directory</h2>
              <p className="text-xs text-ink-500 mt-1">Create accounts and maintain role-specific profiles.</p>
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
            >
              <Plus size={16} /> Add staff
            </button>
          </div>

          <div className="p-5 border-b border-ink-900/10">
            <div className="relative max-w-xl">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, role or specialization..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-sm text-ink-500">Loading staff...</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No staff found" body="Try another search or add a new staff member." />
          ) : (
            <div className="divide-y divide-ink-900/10">
              {filtered.map((member) => (
                <div key={member.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-forest-600/10 text-forest-700 flex items-center justify-center shrink-0">
                      <UserCog size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-ink-900 truncate">{member.name}</div>
                      <div className="text-xs text-ink-500 truncate">{member.email}{member.phone ? ` · ${member.phone}` : ""}</div>
                    </div>
                  </div>

                  <div className="lg:w-40">
                    <span className="inline-flex rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-ink-700">
                      {roleLabels[member.role]}
                    </span>
                  </div>

                  <div className="lg:w-56 text-xs text-ink-600">
                    {member.specialization || "General administration"}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(member)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-900/10 text-xs font-medium text-ink-700 hover:bg-vata-100"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    {member.id !== user?.id && (
                      <button
                        onClick={() => removeStaff(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-500/20 text-xs font-medium text-rose-600 hover:bg-rose-500/5"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-900/30 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-ink-900/10 max-h-[90vh] overflow-auto">
            <div className="px-6 py-5 border-b border-ink-900/10 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-ink-900">{editing ? "Edit staff member" : "Add staff member"}</h2>
                <p className="text-xs text-ink-500 mt-1">{editing ? "Update account and role profile." : "Create a login for an administrator, doctor or therapist."}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-ink-500 hover:text-ink-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                <label className="text-sm text-ink-700">
                  Name
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm"
                  />
                </label>

                <label className="text-sm text-ink-700">
                  Email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm"
                  />
                </label>

                <label className="text-sm text-ink-700">
                  Phone
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm"
                  />
                </label>

                <label className="text-sm text-ink-700">
                  Role
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm bg-white"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="therapist">Therapist</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>

                <label className="text-sm text-ink-700">
                  Specialization
                  <input
                    value={form.specialization}
                    disabled={form.role === "admin"}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder={form.role === "admin" ? "Not required" : "e.g. Panchakarma"}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm disabled:bg-sand-50"
                  />
                </label>

                <label className="text-sm text-ink-700">
                  {editing ? "New password (optional)" : "Password"}
                  <input
                    type="password"
                    minLength={6}
                    required={!editing}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="mt-1.5 w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm"
                  />
                </label>
              </div>

              {error && (
                <div className="mx-6 mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-ink-900/10 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-4 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={busy}
                  type="submit"
                  className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Saving..." : editing ? "Update Staff" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
