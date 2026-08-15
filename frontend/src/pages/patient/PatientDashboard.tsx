import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { Card, EmptyState } from "../../components/Common";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/AuthContext";
import { Clock, User, MapPin, CalendarClock, History, TrendingUp } from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appts, setAppts] = useState<any[]>([]);

  useEffect(() => {
    api.get("/appointments").then(setAppts).catch(console.error);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const next = appts
    .filter((a) => a.session_date >= today && (a.status === "Upcoming" || a.status === "In Progress"))
    .sort((a, b) => (a.session_date + a.start_time).localeCompare(b.session_date + b.start_time))[0];

  const completed = appts.filter((a) => a.status === "Completed").length;
  const total = appts.length;

  return (
    <Shell>
      <PageHeader title={`Hi ${user?.name?.split(" ")[0]}`} subtitle="Here's your Panchakarma therapy at a glance." />
      <div className="p-8 space-y-6 max-w-2xl">
        <Card className="p-6">
          <p className="text-xs font-mono-num uppercase tracking-widest text-ink-500 mb-3">Your next therapy</p>
          {!next ? (
            <EmptyState title="No upcoming therapy scheduled" body="Your care team will notify you once your next session is set." icon={<CalendarClock size={18} />} />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-xl font-semibold text-ink-900">{next.therapy_name}</h2>
                <StatusBadge status={next.status} />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-ink-700">
                <div className="flex items-center gap-2"><Clock size={15} className="text-forest-600" /> {next.session_date === today ? "Today" : next.session_date} · {next.start_time}</div>
                <div className="flex items-center gap-2"><User size={15} className="text-forest-600" /> {next.therapist_name.split(" - ")[1] || next.therapist_name}</div>
                <div className="flex items-center gap-2"><MapPin size={15} className="text-forest-600" /> {next.room_name}</div>
              </div>
            </div>
          )}
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link to="/patient/schedule" className="block">
            <Card className="p-4 hover:border-forest-600/30 transition-colors">
              <CalendarClock className="text-forest-600 mb-2" size={18} />
              <div className="text-sm font-medium text-ink-900">View schedule</div>
            </Card>
          </Link>
          <Card className="p-4">
            <History className="text-forest-600 mb-2" size={18} />
            <div className="text-sm font-medium text-ink-900">{completed} of {total} completed</div>
          </Card>
          <Card className="p-4">
            <TrendingUp className="text-forest-600 mb-2" size={18} />
            <div className="text-sm font-medium text-ink-900">Progress tracked</div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
