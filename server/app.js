require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const rateLimit    = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp          = require("hpp");
const path         = require("path");

const tripRoutes    = require("./src/routes/tripRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const adminRoutes   = require("./src/routes/adminRoutes");
const cabRoutes     = require("./src/routes/cabRoutes");
const placesRoutes  = require("./src/routes/placesRoutes");

const app = express();

app.set("trust proxy", 1);

// ── Security ──────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.disable("x-powered-by");

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.options("*", cors());

// ── Rate Limiting ─────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === "production";

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
}));

// ── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

// ── Static Files ──────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Dev Logger ────────────────────────────────────────────────────────────
if (!isProd) {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ── Health Check ──────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV })
);

// ── API Routes ────────────────────────────────────────────────────────────
app.use("/api/trips",    tripRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/cabs",     cabRoutes);
app.use("/api/places",   placesRoutes);

// ── Serve React in Production ─────────────────────────────────────────────
if (isProd) {
  app.use(express.static(path.join(__dirname, "../client/dist")));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
  });
}

// ── 404 (dev only) ────────────────────────────────────────────────────────
if (!isProd) {
  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
}

// ── Global Error Handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  if (!isProd) console.error(err.stack);
  if (err.message?.startsWith("CORS blocked"))
    return res.status(403).json({ error: err.message });
  res.status(err.status || 500).json({
    error: isProd ? "Internal server error" : err.message,
  });
});

module.exports = app;