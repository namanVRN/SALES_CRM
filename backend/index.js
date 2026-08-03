require("dotenv").config();
const express = require("express");
const cors = require("cors");

const {
  getRetryableSheets,
  getRetryableDrive,
} = require("./utils/sheetsRetry");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://sales-crm-three-gamma.vercel.app",
  "https://sales-crm-vrn.vercel.app",
  "https://vrn-sales.vercel.app",
];

const allowedPatterns = [
  /^https:\/\/sales-crm-.*\.vercel\.app$/,
  /^https:\/\/sales-.*-vrn-inc-s-projects\.vercel\.app$/,
  /^https:\/\/vrn-sales-.*\.vercel\.app$/,
  /^https:\/\/vrn-backend-.*\.vercel\.app$/,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (allowedPatterns.some((p) => p.test(origin))) {
      return callback(null, true);
    }

    console.warn(`⛔ CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Apply CORS middleware (preflight automatic handle hoti hai)
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// Request Logger
// ============================================
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || "none"}`);
  next();
});

// ============================================
// Health Check Routes (No middleware)
// ============================================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend Server is Running!",
    status: "OK",
    version: "1.0.3",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    origin: req.headers.origin || "no-origin",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working!",
    yourOrigin: req.headers.origin || "no-origin",
    allowedOrigins: allowedOrigins,
  });
});

// ============================================
// ✅ Google Clients middleware
// ============================================
const attachGoogleClients = async (req, res, next) => {
  try {
    const [sheets, drive] = await Promise.all([
      getRetryableSheets(),
      getRetryableDrive(),
    ]);
    req.sheets = sheets;
    req.drive = drive;
    next();
  } catch (err) {
    console.error("❌ Failed to init Google clients:", err.message);
    return res.status(503).json({
      success: false,
      error: "Service initializing, please retry in a moment",
      retry: true,
      message: err.message,
    });
  }
};

// ============================================
// Routes
// ============================================
const { protect } = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const nbdinRoutes = require("./routes/nbdApi/nbdinRoutes");
const nbdFieldVisitRoutes = require("./routes/nbdApi/fieldVisitRoutes");
const nbdAfterFieldVisitRoutes = require("./routes/nbdApi/afterFieldVisitRoutes");
const nbdMeetingRoutes = require("./routes/nbdApi/meetingNbdRoutes");

const cpFollowupRoutes = require("./routes/cp/cpFollowupRoutes");
const cpFieldVisitRoutes = require("./routes/cp/cpFieldVisitRoutes");
const cpAfterFieldVisitRoutes = require("./routes/cp/cpAfterFieldVisitRoutes");
const cpMeetingRoutes = require("./routes/cp/cpMeetingRoutes");
const cpBookingRoutes = require("./routes/cp/cpBookingRoutes");
const cpLeadFormRoutes = require("./routes/cp/cpLeadFormRoutes");
const cpContactUpdateRoutes = require("./routes/cp/cpContactUpdateRoutes");
const cnpRoutes = require("./routes/nbdApi/cnpRoutes");
const leadSearchRoutes = require("./routes/leadSearch");
const callToBrokerRoutes = require("./routes/cp/callToBrokerRoutes");
const fullKittingRoutes = require("./routes/meetings/fullKittingRoutes");
const meetingsSubRoutes = require("./routes/meetings/meetingsSubRoutes");
const agreementRoutes = require("./routes/meetings/agreementRoutes");

// Apply Google clients middleware to all API routes
app.use("/api/auth", attachGoogleClients, authRoutes);
app.use("/api/leads", attachGoogleClients, protect, nbdinRoutes);
app.use("/api/field-visit", attachGoogleClients, protect, nbdFieldVisitRoutes);
app.use("/api/after-field-visit", attachGoogleClients, protect, nbdAfterFieldVisitRoutes);
app.use("/api/meeting-nbd", attachGoogleClients, protect, nbdMeetingRoutes);

app.use("/api/cp/followup", attachGoogleClients, cpFollowupRoutes);
app.use("/api/cp/field-visit", attachGoogleClients, cpFieldVisitRoutes);
app.use("/api/cp/after-field-visit", attachGoogleClients, cpAfterFieldVisitRoutes);
app.use("/api/cp/meeting", attachGoogleClients, cpMeetingRoutes);
app.use("/api/cp/booking", attachGoogleClients, cpBookingRoutes);
app.use("/api/cp/lead-form", attachGoogleClients, cpLeadFormRoutes);

app.use("/cp", attachGoogleClients, cpContactUpdateRoutes);
app.use("/api/leads", attachGoogleClients, protect, leadSearchRoutes);
app.use("/api/cnp", attachGoogleClients, protect, cnpRoutes);
app.use("/api/call-to-broker", attachGoogleClients, protect, callToBrokerRoutes);
app.use("/api/meetings/full-kitting", attachGoogleClients, fullKittingRoutes);
app.use("/api/meetings/meetings-sub", attachGoogleClients, meetingsSubRoutes);
app.use("/api/meetings/agreement", attachGoogleClients, agreementRoutes);

// ============================================
// Warmup endpoint
// ============================================
app.get("/api/warmup", attachGoogleClients, async (req, res) => {
  const t = Date.now();
  try {
    await req.sheets.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      fields: "spreadsheetId",
    });
    res.json({
      success: true,
      warm: true,
      ms: Date.now() - t,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      ms: Date.now() - t,
    });
  }
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);

  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      error: "CORS Error",
      message: err.message,
      yourOrigin: req.headers.origin,
    });
  }

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message,
  });
});

// ============================================
// 404 Handler (No wildcard - just middleware)
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📋 Allowed Origins:`, allowedOrigins);
  });
}

module.exports = app;