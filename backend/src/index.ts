import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initSchema } from "./db/index.js";

import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patients.js";
import directoryRoutes from "./routes/directory.js";
import treatmentPlanRoutes from "./routes/treatmentPlans.js";
import schedulerRoutes from "./routes/scheduler.js";
import appointmentRoutes from "./routes/appointments.js";
import analyticsRoutes from "./routes/analytics.js";
import notificationRoutes from "./routes/notifications.js";
import assistantRoutes from "./routes/assistant.js";
import aiRoutes from "./routes/ai.js";
import protocolRoutes from "./routes/protocols.js";
import staffRoutes from "./routes/staff.js";

dotenv.config();
initSchema();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.includes("*")
    ? true
    : (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("CORS origin not allowed"));
      },
}));
app.use(express.json());

app.get("/", (_req, res) => res.json({
  service: "AyurSutra",
  status: "running",
  api: "/api/health",
  message: "Panchakarma patient management and smart scheduling API"
}));

app.get("/api/health", (_req, res) => res.json({
  status: "ok",
  service: "ayursutra-backend",
  timestamp: new Date().toISOString()
}));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api", directoryRoutes); // /doctors, /therapists, /therapies, /rooms
app.use("/api/treatment-plans", treatmentPlanRoutes);
app.use("/api/scheduler", schedulerRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/protocols", protocolRoutes);
app.use("/api/staff", staffRoutes);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AyurSutra backend running on http://localhost:${PORT}`));
