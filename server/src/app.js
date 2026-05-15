require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const path = require("path");

const tripRoutes    = require("./src/routes/tripRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const adminRoutes   = require("./src/routes/adminRoutes");
const cabRoutes     = require("./src/routes/cabRoutes");

const app = express();

// ── Trust proxy (required for rate-limit on Render) ───────────────────────
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}));
app.disable("x-powered-by");

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());

// ── Rate limiting ─────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === "production";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 2000,   // generous in dev so testing doesn't hit 429
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,     // strict in prod, loose in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: false,
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking requests. Please try again later." },
});

app.use(globalLimiter);

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ── Sanitization ──────────────────────────────────────────────────────────
app.use(mongoSanitize());
app.use(hpp());

// ── Static uploads ────────────────────────────────────────────────────────
// In production, uploaded images live in server/uploads/
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Dev request logger ────────────────────────────────────────────────────
if (!isProd) {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ── Health check ──────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV })
);

// ── API routes ────────────────────────────────────────────────────────────
app.use("/api/trips",    tripRoutes);
app.use("/api/bookings", bookingLimiter, bookingRoutes);
app.use("/api/admin",    authLimiter,    adminRoutes);
app.use("/api/cabs",     cabRoutes);

// ── Serve React build in production (single URL) ──────────────────────────
if (isProd) {
  // client/dist is built before deployment
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // React Router fallback — all non-API routes serve index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
}

// ── 404 (dev only — in prod the wildcard above catches everything) ─────────
if (!isProd) {
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
}

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  if (!isProd) console.error(err.stack);

  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: isProd ? "Internal server error" : err.message,
  });
});

module.exports = app;