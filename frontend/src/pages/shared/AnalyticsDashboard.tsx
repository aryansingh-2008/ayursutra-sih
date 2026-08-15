import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import PageHeader from "../../components/PageHeader";
import { StatCard, Card } from "../../components/Common";
import { api } from "../../lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const PIE_COLORS = ["#1F6F5C", "#C97B2E", "#B3543F"];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get("/analytics").then(setData).catch(console.error);
  }, []);

  if (!data) return <Shell><div className="p-8 text-sm text-ink-500">Loading…</div></Shell>;

  const statusPie = [
    { name: "Completed", value: data.completed },
    { name: "Missed", value: data.missed },
    { name: "Rescheduled", value: data.rescheduled },
  ].filter((d) => d.value > 0);

  return (
    <Shell>
      <PageHeader title="Analytics" subtitle="Operational insight across patients, sessions and resources" />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total patients" value={data.totalPatients} />
          <StatCard label="Active plans" value={data.activePlans} />
          <StatCard label="Today's therapies" value={data.todayTherapies} />
          <StatCard label="Completed sessions" value={data.completed} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">Sessions per day</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.sessionsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1F6F5C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">Completed vs. missed vs. rescheduled</h2>
            {statusPie.length === 0 ? (
              <p className="text-xs text-ink-500">No session outcomes recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" outerRadius={85} label>
                    {statusPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">Therapist workload</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.therapistWorkload} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="therapist" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#7A9E7E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink-900 mb-4">Room utilization</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.roomUtilization} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2d8" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="room" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#C97B2E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
