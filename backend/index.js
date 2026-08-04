


require("dotenv").config();
const express = require("express");

const {
  getRetryableSheets,
  getRetryableDrive,
} = require("./utils/sheetsRetry");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// CORS - Allow ALL origins (Simple)
// ============================================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Max-Age", "0");
  
  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || "none"}`);
  next();
});

// ============================================
// Health Check Routes
// ============================================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Backend Server is Running!",
    status: "OK",
    version: "1.0.9",
    timestamp: new Date().toISOString(),
    cors: "* (all origins allowed)",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
    version: "1.0.9",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working - all origins allowed!",
    yourOrigin: req.headers.origin || "no-origin",
    version: "1.0.9",
  });
});

// ============================================
// Google Clients middleware
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
const birthdayRoutes = require("./routes/cp/birthdayRoutes");

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
app.use("/api/cp/birthdays", attachGoogleClients, birthdayRoutes);

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
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message,
  });
});

// ============================================
// 404 Handler
// ============================================
app.use(function (req, res) {
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
    console.log(`🌐 CORS: All origins allowed (*)`);
  });
}

module.exports = app;