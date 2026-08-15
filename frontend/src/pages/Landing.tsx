import { Link } from "react-router-dom";
import { Leaf, CalendarCheck2, Users2, LineChart, Sparkles, ArrowRight } from "lucide-react";

const JOURNEY = [
  { label: "Patient Registered", detail: "Intake and history captured once, used everywhere." },
  { label: "Assessment", detail: "Doctor reviews condition and treatment goals." },
  { label: "Treatment Plan Created", detail: "Therapies, sequence and duration are defined." },
  { label: "Smart Scheduling", detail: "Therapist, room and timing resolved automatically." },
  { label: "Therapy Sessions", detail: "Each session tracked from upcoming to completed." },
  { label: "Progress Review", detail: "Doctor sees an evidence-based summary, not guesswork." },
  { label: "Follow-up", detail: "Next visit scheduled before the patient walks out." },
];

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: "Smart Scheduling",
    body: "Every session checks therapist availability, room capacity and existing bookings before it's proposed — conflicts surface immediately, with alternatives.",
  },
  {
    icon: Users2,
    title: "Multi-role coordination",
    body: "Doctors, therapists and patients see the same schedule update in real time, from treatment plan to completed session.",
  },
  {
    icon: LineChart,
    title: "Treatment journey tracking",
    body: "One timeline per patient — from registration to follow-up — instead of scattered paper charts.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted, not AI-decided",
    body: "Progress summaries and scheduling suggestions are generated for review. A clinician always confirms.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-sand-50">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="text-forest-600" size={24} strokeWidth={2.2} />
          <span className="font-display text-xl font-semibold text-ink-900">AyurSutra</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink-700 hover:text-forest-700 px-3 py-2">
            Sign in
          </Link>
          <Link
            to="/login"
            className="text-sm font-medium bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-mono-num uppercase tracking-widest text-forest-700 bg-forest-600/10 px-3 py-1 rounded-full mb-5">
            SIH25023 · Panchakarma Patient Management
          </span>
          <h1 className="font-display text-5xl leading-[1.08] font-semibold text-ink-900 mb-5">
            Smarter Panchakarma.
            <br />
            Better patient coordination.
          </h1>
          <p className="text-lg text-ink-700 mb-8 max-w-lg">
            Digitally manage Panchakarma patients, treatment plans and therapy schedules through one intelligent
            platform built for the clinic floor — not a generic hospital system.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-forest-600 hover:bg-forest-700 text-white px-5 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-ink-900/15 hover:border-forest-600/40 text-ink-900 px-5 py-3 rounded-lg font-medium transition-colors"
            >
              Explore Dashboard
            </Link>
          </div>
        </div>

        {/* Signature element: the treatment journey, rendered as a growing root/vein path */}
        <div className="relative bg-white rounded-2xl border border-ink-900/10 shadow-sm p-8">
          <p className="text-xs font-mono-num uppercase tracking-widest text-ink-500 mb-6">The treatment journey</p>
          <ol className="relative border-l-2 border-forest-600/20 pl-6 space-y-5">
            {JOURNEY.map((step) => (
              <li key={step.label} className="relative">
                <span className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-forest-600 ring-4 ring-forest-600/15" />
                <div className="text-sm font-semibold text-ink-900">{step.label}</div>
                <div className="text-xs text-ink-500 mt-0.5">{step.detail}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="bg-white border-y border-ink-900/10">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-900 mb-3">The problem</h2>
            <ul className="space-y-2 text-ink-700 text-sm">
              <li>— Manual, paper-based therapy schedules</li>
              <li>— Double-bookings between therapists and rooms</li>
              <li>— Missed sessions no one catches in time</li>
              <li>— No shared view between doctor and therapist</li>
              <li>— Treatment history scattered across files</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-900 mb-3">The solution</h2>
            <p className="text-ink-700 text-sm leading-relaxed">
              AyurSutra centers every workflow on the Panchakarma treatment plan: a doctor defines the therapies and
              duration, the scheduler resolves therapist and room availability automatically, and every role — doctor,
              therapist, patient — works from the same live schedule.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-ink-900 mb-8">Built around the therapy floor</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-ink-900/10 p-5 hover:border-forest-600/30 transition-colors">
              <f.icon className="text-forest-600 mb-3" size={20} />
              <h3 className="font-semibold text-ink-900 text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-ink-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-xs text-ink-500 border-t border-ink-900/10">
        AyurSutra — built for SIH25023. A clinical decision support and scheduling tool; it assists doctors and
        therapists and does not replace clinical judgment.
      </footer>
    </div>
  );
}
