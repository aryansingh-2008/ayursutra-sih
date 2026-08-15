import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@ayursutra.demo" },
  { role: "Doctor", email: "dr.mehta@ayursutra.demo" },
  { role: "Doctor", email: "dr.sharma@ayursutra.demo" },
  { role: "Patient", email: "rahul.sharma@ayursutra.demo" },
  { role: "Patient", email: "ananya.verma@ayursutra.demo" },
  { role: "Therapist", email: "kavya.nair@ayursutra.demo" },
  { role: "Therapist", email: "rohan.iyer@ayursutra.demo" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      nav(`/${user.role}`);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <Leaf className="text-forest-600" size={24} strokeWidth={2.2} />
          <span className="font-display text-xl font-semibold text-ink-900">AyurSutra</span>
        </div>

        <div className="bg-white border border-ink-900/10 rounded-2xl shadow-sm p-7">
          <h1 className="font-display text-xl font-semibold text-ink-900 mb-1">Sign in</h1>
          <p className="text-sm text-ink-500 mb-6">Access your Panchakarma dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40 focus:border-forest-600"
                placeholder="you@ayursutra.demo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-ink-900/15 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/40 focus:border-forest-600"
              />
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-600 hover:bg-forest-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <div className="mt-5 bg-white/60 border border-ink-900/10 rounded-xl p-4">
          <p className="text-xs font-medium text-ink-700 mb-2">Demo accounts (password: demo1234)</p>
          <div className="grid grid-cols-1 gap-1">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => {
                  setEmail(a.email);
                  setPassword("demo1234");
                }}
                className="flex items-center justify-between text-xs text-left px-2.5 py-1.5 rounded-md hover:bg-vata-100 transition-colors"
              >
                <span className="text-ink-500">{a.role}</span>
                <span className="font-mono-num text-ink-700">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
