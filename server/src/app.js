import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/students.js";
import dashboardRoutes from "./routes/dashboard.js";
import userRoutes from "./routes/users.js";
import courseRoutes from "./routes/courses.js";
import instructorRoutes from "./routes/instructors.js";
import programRoutes from "./routes/programs.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const allowedOrigins = String(
  process.env.CLIENT_ORIGIN || "http://localhost:5174,https://student-1-7clo.onrender.com",
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    maxAge: 86400,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    service: "mern-practice-api",
    message: "API server is running.",
    health: "/api/health",
  });
});

app.use((req, res, next) => {
  if (
    !["POST", "PATCH", "PUT"].includes(req.method) ||
    req.is("multipart/form-data")
  ) {
    return next();
  }

  if (req.body === undefined) req.body = {};
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res
      .status(400)
      .json({ message: "Request body must be a JSON object." });
  }

  next();
});

app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    service: "mern-practice-api",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
  authRoutes,
);
app.use("/api/students", studentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/instructors", instructorRoutes);
app.use("/api/programs", programRoutes);

app.use(notFound);
app.use((error, req, res, next) => {
  if (error?.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ message: "Request body contains invalid JSON." });
  }
  if (error.message?.includes("origin")) {
    return res
      .status(403)
      .json({ message: "This website is not allowed to access the API." });
  }
  return errorHandler(error, req, res, next);
});

export default app;
