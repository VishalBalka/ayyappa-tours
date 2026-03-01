const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const tripRoutes    = require("./src/routes/tripRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const adminRoutes   = require("./src/routes/adminRoutes");

const app = express();

// ── Security Headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // enable & tune when you go to production
}));

// Hide server fingerprint
app.disable("x-powered-by");

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,            // allow cookies
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.options("*", cors());       // pre-flight for all routes

// ── Rate Limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 200,                     // max 200 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                      // max 10 login attempts per 15 min
  message: { error: "Too many login attempts. Please try again later." },
});

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 20,                      // max 20 bookings per IP per hour
  message: { error: "Too many booking requests. Please try again later." },
});

app.use(globalLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));   // prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ── Request Logging (dev only) ────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ── Health Check ──────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ status: "ok", service: "Ayyappa Tours API" })
);

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/trips",    tripRoutes);
app.use("/api/bookings", bookingLimiter, bookingRoutes);
app.use("/api/admin",    authLimiter,    adminRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ error: "Route not found" })
);

// ── Global Error Handler ──────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Don't leak stack traces to client in production
  const isDev = process.env.NODE_ENV !== "production";
  console.error("❌ Unhandled error:", err.message);
  if (isDev) console.error(err.stack);

  // Handle CORS errors specifically
  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: isDev ? err.message : "Internal server error",
  });
});

module.exports = app;