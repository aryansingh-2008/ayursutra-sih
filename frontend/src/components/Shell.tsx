import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  LayoutDashboard,
  Users,
  BrainCircuit,
  BookOpen,
  UserCog,
  CalendarClock,
  BarChart3,
  LogOut,
  Leaf,
  ClipboardList,
  CalendarDays,
  User,
} from "lucide-react";

const NAV: Record<string, { to: string; label: string; icon: any }[]> = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/patients", label: "Patients", icon: Users },
    { to: "/admin/staff", label: "Staff Management", icon: UserCog },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/protocols", label: "Protocol Library", icon: BookOpen },
  ],
  doctor: [
    { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/doctor/patients", label: "Patients", icon: Users },
    { to: "/doctor/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/doctor/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/doctor/ai-copilot", label: "AI Clinical Copilot", icon: BrainCircuit },
    { to: "/doctor/protocols", label: "Protocol Library", icon: BookOpen },
  ],
  therapist: [
    { to: "/therapist", label: "Today's Sessions", icon: ClipboardList },
    { to: "/therapist/calendar", label: "Calendar", icon: CalendarDays },
  ],
  patient: [
    { to: "/patient", label: "My Dashboard", icon: LayoutDashboard },
    { to: "/patient/schedule", label: "My Schedule", icon: CalendarClock },
    { to: "/patient/profile", label: "Profile", icon: User },
  ],
};

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return <>{children}</>;
  const items = NAV[user.role] || [];

  return (
    <div className="min-h-screen flex bg-sand-50">
      <aside className="w-60 shrink-0 border-r border-ink-900/10 bg-white flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-ink-900/10">
          <Leaf className="text-forest-600" size={22} strokeWidth={2.2} />
          <span className="font-display text-lg font-semibold tracking-tight text-ink-900">AyurSutra</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-forest-600 text-white" : "text-ink-700 hover:bg-vata-100"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-ink-900/10">
          <div className="px-3 mb-2">
            <div className="text-sm font-medium text-ink-900">{user.name}</div>
            <div className="text-xs text-ink-500 capitalize">{user.role}</div>
          </div>
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-vata-100"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
