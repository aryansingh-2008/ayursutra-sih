import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";

import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PatientList from "./pages/doctor/PatientList";
import PatientDetails from "./pages/doctor/PatientDetails";
import CreateTreatmentPlan from "./pages/doctor/CreateTreatmentPlan";
import SmartScheduler from "./pages/doctor/SmartScheduler";
import AICopilot from "./pages/doctor/AICopilot";

import TherapistDashboard from "./pages/therapist/TherapistDashboard";

import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientSchedule from "./pages/patient/PatientSchedule";
import PatientProfile from "./pages/patient/PatientProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminStaff from "./pages/admin/AdminStaff";

import CalendarView from "./pages/shared/CalendarView";
import AnalyticsDashboard from "./pages/shared/AnalyticsDashboard";
import ProtocolLibrary from "./pages/shared/ProtocolLibrary";

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute roles={["admin"]}><AdminPatients /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute roles={["admin"]}><AdminStaff /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute roles={["admin"]}><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/admin/protocols" element={<ProtectedRoute roles={["admin"]}><ProtocolLibrary /></ProtectedRoute>} />

          {/* Doctor */}
          <Route path="/doctor" element={<ProtectedRoute roles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute roles={["doctor"]}><PatientList /></ProtectedRoute>} />
          <Route path="/doctor/patients/:id" element={<ProtectedRoute roles={["doctor"]}><PatientDetails /></ProtectedRoute>} />
          <Route path="/doctor/patients/:id/new-plan" element={<ProtectedRoute roles={["doctor"]}><CreateTreatmentPlan /></ProtectedRoute>} />
          <Route path="/doctor/scheduler/:planId" element={<ProtectedRoute roles={["doctor"]}><SmartScheduler /></ProtectedRoute>} />
          <Route path="/doctor/calendar" element={<ProtectedRoute roles={["doctor"]}><CalendarView /></ProtectedRoute>} />
          <Route path="/doctor/analytics" element={<ProtectedRoute roles={["doctor"]}><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/doctor/ai-copilot" element={<ProtectedRoute roles={["doctor"]}><AICopilot /></ProtectedRoute>} />
          <Route path="/doctor/protocols" element={<ProtectedRoute roles={["doctor"]}><ProtocolLibrary /></ProtectedRoute>} />

          {/* Therapist */}
          <Route path="/therapist" element={<ProtectedRoute roles={["therapist"]}><TherapistDashboard /></ProtectedRoute>} />
          <Route path="/therapist/calendar" element={<ProtectedRoute roles={["therapist"]}><CalendarView /></ProtectedRoute>} />

          {/* Patient */}
          <Route path="/patient" element={<ProtectedRoute roles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/schedule" element={<ProtectedRoute roles={["patient"]}><PatientSchedule /></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute roles={["patient"]}><PatientProfile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
