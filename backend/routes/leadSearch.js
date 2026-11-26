// const express = require("express");
// const router = express.Router();

// const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// const SHEET_NAME = "END USER LEADS FMS";
// const CP_SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// const CP_LEAD_SHEET = "Channel Partner Lead FMS";

// // ============================================
// // Step Detection Logic
// // ============================================

// function detectLeadStep(row) {
//   const getCol = (index) => (row[index] ? row[index].trim() : "");

//   const uniqueId = getCol(1);
//   const customerName = getCol(2);
//   const customerContact = getCol(3);
//   const projectSelection = getCol(5);
//   const leadSource = getCol(6);

//   // Step 1: First Follow Up - Column O (14)
//   const step1Status = getCol(14);
//   const isInStep1 =
//     step1Status === "" ||
//     step1Status.toLowerCase() === "no conversation" ||
//     step1Status.toLowerCase() === "next follow up";

//   // Step 2: Site Visit
//   const step2PlannedDate = getCol(20);
//   const step2Status = getCol(22);
//   const step2StatusLower = step2Status.toLowerCase();

//   // ✅ NEW: CNP detection
//   const isInCNP = step2StatusLower === "call not picked";

//   const isInStep2 =
//     step2PlannedDate &&
//     (step2Status === "" ||
//       step2StatusLower === "pending" ||
//       step2StatusLower === "rescheduled" ||
//       step2StatusLower === "next followup required" ||
//       step2StatusLower === "cold");

//   // Step 3
//   const step3PlannedDate = getCol(26);
//   const step3ActualDate = getCol(27);
//   const step3Status = getCol(28);
//   const step3StatusLower = step3Status.toLowerCase();
//   const isInStep3 =
//     (step3PlannedDate && !step3ActualDate) ||
//     step3StatusLower === "no conversation" ||
//     step3StatusLower === "next follow up" ||
//     step3StatusLower === "next field visit required";

//   // Step 4
//   const step4PlannedDate = getCol(33);
//   const step4ActualDate = getCol(34);
//   const step4Status = getCol(35);
//   const step4StatusLower = step4Status.toLowerCase();
//   const isInStep4 =
//     step4PlannedDate &&
//     (!step4Status ||
//       step4StatusLower === "rescheduled" ||
//       step4StatusLower === "next field visit required");

//   // Step 5: Booking
//   const step5PlannedDate = getCol(38);
//   const isInStep5 = step5PlannedDate !== "";

//   // ✅ NEW: CP Can/Cannot Contact (Col AM = index 38)
//   const cpCanContactFlag = getCol(38); // "Yes" or "No" in CP sheet
//   const canContact = cpCanContactFlag === "No" ? "No" : "Yes";

//   let currentStep = null;
//   let stepName = "";
//   let stepStatus = "";
//   let stepPlannedDate = "";
//   let stepColor = "";
//   let stepIcon = "";

//   // ✅ Priority: CNP first (sub-state of Step 2)
//   if (isInCNP) {
//     currentStep = 2;
//     stepName = "Call Not Picked (CNP)";
//     stepStatus = "Call Not Picked";
//     stepPlannedDate = step2PlannedDate;
//     stepColor = "#0891b2"; // Cyan
//     stepIcon = "bi-telephone-x-fill";
//   } else if (isInStep1) {
//     currentStep = 1;
//     stepName = "First Follow-Up";
//     stepStatus = step1Status || "Pending";
//     stepPlannedDate = "";
//     stepColor = "#3b82f6";
//     stepIcon = "bi-telephone-fill";
//   } else if (isInStep2) {
//     currentStep = 2;
//     stepName = "Site Visit";
//     stepStatus = step2Status || "Pending";
//     stepPlannedDate = step2PlannedDate;
//     stepColor = "#ec4899";
//     stepIcon = "bi-geo-alt-fill";
//   } else if (isInStep3) {
//     currentStep = 3;
//     stepName = "After Site Visit Follow-Up";
//     stepStatus = step3Status || "Pending";
//     stepPlannedDate = step3PlannedDate;
//     stepColor = "#f59e0b";
//     stepIcon = "bi-chat-dots-fill";
//   } else if (isInStep4) {
//     currentStep = 4;
//     stepName = "Meeting";
//     stepStatus = step4Status || "Pending";
//     stepPlannedDate = step4PlannedDate;
//     stepColor = "#8b5cf6";
//     stepIcon = "bi-calendar-check-fill";
//   } else if (isInStep5) {
//     currentStep = 5;
//     stepName = "Booking";
//     stepStatus = "Booking Pending";
//     stepPlannedDate = step5PlannedDate;
//     stepColor = "#10b981";
//     stepIcon = "bi-check-circle-fill";
//   }

//   // Completed check
//   const finalStatuses = [
//     "done",
//     "not interested",
//     "negotiation failed",
//     "deal not done",
//     "booked",
//   ];
//   if (step4StatusLower && finalStatuses.includes(step4StatusLower)) {
//     currentStep = 0;
//     stepName = "Completed/Closed";
//     stepStatus = step4Status;
//     stepColor = "#6b7280";
//     stepIcon = "bi-check-all";
//   }

//   return {
//     uniqueId,
//     customerName,
//     customerContact,
//     projectSelection,
//     leadSource,
//     currentStep,
//     stepName,
//     stepStatus,
//     stepPlannedDate,
//     stepColor,
//     stepIcon,
//     canContact, // ✅ NEW
//   };
// }

// // ============================================
// // Search in Sheet
// // ============================================

// async function searchInSheet(sheets, spreadsheetId, sheetName, searchTerm, sheetType) {
//   try {
//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId: spreadsheetId,
//       range: `'${sheetName}'!A8:AO`,
//     });

//     const rows = response.data.values || [];
//     const results = [];
//     const searchLower = searchTerm.toLowerCase().trim();

//     rows.forEach((row, index) => {
//       const customerName = row[2] ? row[2].trim().toLowerCase() : "";
//       const customerContact = row[3] ? row[3].trim() : "";
//       const uniqueId = row[1] ? row[1].trim().toLowerCase() : "";
//       const leadGenName = row[8] ? row[8].trim().toLowerCase() : "";

//       // Search by name, contact, or unique ID
//       const isMatch = 
//         customerName.includes(searchLower) ||
//         customerContact.includes(searchLower) ||
//         uniqueId.includes(searchLower) ||
//         leadGenName.includes(searchLower);

//       if (isMatch) {
//         const leadInfo = detectLeadStep(row);
        
//         if (leadInfo.currentStep !== null) {
//           results.push({
//             ...leadInfo,
//             rowIndex: index + 8,
//             sheetName: sheetName,
//             sheetType: sheetType, // "Direct" or "Channel Partner"
//             spreadsheetId: spreadsheetId,
//           });
//         }
//       }
//     });

//     return results;
//   } catch (error) {
//     console.error(`Error searching in ${sheetName}:`, error.message);
//     return [];
//   }
// }

// // ============================================
// // ROUTES
// // ============================================

// router.get("/search", async (req, res) => {
//   try {
//     const { q } = req.query;

//     if (!q || q.trim().length < 2) {
//       return res.status(400).json({
//         success: false,
//         error: "Search term must be at least 2 characters",
//       });
//     }

//     const searchTerm = q.trim();

//     // Search in both sheets
//     const [directResults, cpResults] = await Promise.all([
//       searchInSheet(req.sheets, SPREADSHEET_ID, SHEET_NAME, searchTerm, "Direct"),
//       searchInSheet(req.sheets, CP_SPREADSHEET_ID, CP_LEAD_SHEET, searchTerm, "Channel Partner"),
//     ]);

//     // Combine results
//     const allResults = [...directResults, ...cpResults];

//     // Sort by step (highest first) and then by name
//     allResults.sort((a, b) => {
//       if (b.currentStep !== a.currentStep) {
//         return b.currentStep - a.currentStep;
//       }
//       return a.customerName.localeCompare(b.customerName);
//     });

//     res.json({
//       success: true,
//       data: allResults,
//       total: allResults.length,
//       searchTerm: searchTerm,
//     });
//   } catch (err) {
//     console.error("Search error:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // Get lead details by unique ID
// router.get("/lead/:uniqueId", async (req, res) => {
//   try {
//     const { uniqueId } = req.params;

//     if (!uniqueId) {
//       return res.status(400).json({
//         success: false,
//         error: "Unique ID is required",
//       });
//     }

//     // Search in both sheets
//     const [directResults, cpResults] = await Promise.all([
//       searchInSheet(req.sheets, SPREADSHEET_ID, SHEET_NAME, uniqueId, "Direct"),
//       searchInSheet(req.sheets, CP_SPREADSHEET_ID, CP_LEAD_SHEET, uniqueId, "Channel Partner"),
//     ]);

//     const allResults = [...directResults, ...cpResults];
    
//     // Find exact match
//     const exactMatch = allResults.find(
//       (r) => r.uniqueId.toLowerCase() === uniqueId.toLowerCase()
//     );

//     if (exactMatch) {
//       res.json({
//         success: true,
//         data: exactMatch,
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         error: "Lead not found",
//       });
//     }
//   } catch (err) {
//     console.error("Lead fetch error:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// module.exports = router;









const express = require("express");
const router = express.Router();

// ============================================================
// 🔍 Universal Lead Search (navbar)
//  - Name / Unique ID / Lead Gen Name / Phone (only digits, +91 & spaces ignored)
//  - Step = same conditions as each dashboard page list
//  - Shows only leads the logged-in user can open, with the exact page route
// ============================================================

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = "END USER LEADS FMS";
const CP_LEAD_SHEET = "Channel Partner Lead FMS";
const MAX_RESULTS = 20;
const CACHE_MS = 15 * 1000; // sheet data re-used for 15 sec while typing

// USERS sheet → AssignedModule "nbd" (BDM) → Doer tag (column AM)
const NBD_DOER = {
  "bdm1@company.com": "BDM1",
  "bdm2@company.com": "BDM2",
  "bdm6@company.com": "BDM6",
  "bdm7@company.com": "BDM7",
  "bdm15@company.com": "BDM15",
  "bdm16@company.com": "BDM16",
  "varun@company.com": "Varun Sir",
  "mohan@company.com": "Mohan Sir",
};

// USERS sheet → AssignedModule "fsr" → FSR code (column AN)
const FSR_CODES = {
  "bdm4@company.com": "BDM4",
  "bdm5@company.com": "BDM5",
  "bdm8@company.com": "BDM8",
  "bdm9@company.com": "BDM9",
  "bdm11@company.com": "BDM11",
  "bdm12@company.com": "BDM12",
  "bdm13@company.com": "BDM13",
  "bdm14@company.com": "BDM14",
};

const STEP_INFO = {
  step1:      { currentStep: 1, stepName: "First Follow-Up",            stepColor: "#3b82f6", stepIcon: "bi-telephone-fill" },
  cnp:        { currentStep: 2, stepName: "Call Not Picked (CNP)",      stepColor: "#0891b2", stepIcon: "bi-telephone-x-fill" },
  fieldVisit: { currentStep: 2, stepName: "Site Visit",                 stepColor: "#ec4899", stepIcon: "bi-geo-alt-fill" },
  afterFV:    { currentStep: 3, stepName: "After Site Visit Follow-Up", stepColor: "#f59e0b", stepIcon: "bi-chat-dots-fill" },
  meeting:    { currentStep: 4, stepName: "Meeting",                    stepColor: "#8b5cf6", stepIcon: "bi-calendar-check-fill" },
  closed:     { currentStep: 0, stepName: "Closed",                     stepColor: "#6b7280", stepIcon: "bi-check-all" },
};

// Page routes (must match App.jsx)
const NBD_ROUTES = {
  step1: "/nbd-in/NBD_IN",
  cnp: "/nbd-in/cnp",
  fieldVisit: "/nbd-in/field-visit",
  afterFV: "/nbd-in/followup",
  meeting: "/nbd-in/meeting",
};
const FSR_ROUTES = {
  fieldVisit: "/fsr/field-visit",
  afterFV: "/fsr/followup",
  meeting: "/fsr/meeting",
};
const CP_ROUTES = {
  can: {
    step1: "/cp/can-contact/follow-up",
    fieldVisit: "/cp/can-contact/field-visit",
    afterFV: "/cp/can-contact/after-field-visit",
    meeting: "/cp/can-contact/meetings",
  },
  cannot: {
    step1: "/cp/cannot-contact/follow-up",
    fieldVisit: "/cp/cannot-contact/field-visit",
    afterFV: "/cp/cannot-contact/after-field-visit",
    meeting: "/cp/cannot-contact/meetings",
  },
};

const col = (row, i) => (row[i] ? String(row[i]).trim() : "");
const onlyDigits = (v) => String(v || "").replace(/\D/g, "");

// ============================================
// Step detection — latest step first
// ============================================

// NBD ("END USER LEADS FMS") — same as nbdin / fieldVisit / cnp / afterFieldVisit / meetingNbd routes
function detectNbdStep(row) {
  const s1 = col(row, 14), s2 = col(row, 22), s3 = col(row, 28), s4 = col(row, 35);
  const s2l = s2.toLowerCase(), s4l = s4.toLowerCase();

  if ([s1, s2, s3, s4].some((s) => s.toLowerCase() === "not interested"))
    return { key: "closed", status: "Not Interested", planned: "" };

  const p4 = col(row, 33);
  if (p4 && (!s4 || s4l === "rescheduled" || s4l === "next field visit required"))
    return { key: "meeting", status: s4 || "Pending", planned: p4 };

  const p3 = col(row, 26), a3 = col(row, 27);
  if ((p3 && !a3) || s3 === "No conversation" || s3 === "Next Follow Up" || s3 === "Next Field Visit Required")
    return { key: "afterFV", status: s3 || "Pending", planned: p3 };

  const p2 = col(row, 20);
  if (s2l === "call not picked")
    return { key: "cnp", status: "Call Not Picked", planned: p2 };
  if (p2 && (!s2 || s2l === "rescheduled" || s2l === "next followup required" || s2l === "cold"))
    return { key: "fieldVisit", status: s2 || "Pending", planned: p2 };

  if (s1 === "" || s1 === "No conversation" || s1 === "Next Follow Up")
    return { key: "step1", status: s1 || "Pending", planned: col(row, 16) || col(row, 12) };

  return { key: "closed", status: s4 || s3 || s2 || s1 || "Completed", planned: "" };
}

// CP ("Channel Partner Lead FMS") — same as cpFollowup / cpFieldVisit / cpAfterFieldVisit / cpMeeting routes
function detectCpStep(row) {
  const s1 = col(row, 14), s2 = col(row, 22), s3 = col(row, 28), s4 = col(row, 35);
  const s2l = s2.toLowerCase(), s4l = s4.toLowerCase();

  if ([s1, s2, s3, s4].some((s) => s.toLowerCase() === "not interested"))
    return { key: "closed", status: "Not Interested", planned: "" };

  const p4 = col(row, 33);
  if (p4 && (!s4 || s4l === "rescheduled"))
    return { key: "meeting", status: s4 || "Pending", planned: p4 };

  const p3 = col(row, 26), a3 = col(row, 27);
  if ((p3 && !a3) || s3 === "No conversation" || s3 === "Next Follow Up")
    return { key: "afterFV", status: s3 || "Pending", planned: p3 };

  const p2 = col(row, 20);
  if (p2 && (!s2 || s2l === "rescheduled" || s2l === "no connection"))
    return { key: "fieldVisit", status: s2 || "Pending", planned: p2 };

  if (s1 === "" || s1 === "No conversation" || s1 === "Next Follow Up")
    return { key: "step1", status: s1 || "Pending", planned: col(row, 12) };

  return { key: "closed", status: s4 || s3 || s2 || s1 || "Completed", planned: "" };
}

// ============================================
// Who can open which lead (same filters as the pages)
// returns: { visible, route }
// ============================================
function getAccess(user, sheetType, stepKey, row) {
  const role = user?.role;
  const module = user?.assignedModule;
  const email = (user?.email || "").toLowerCase();
  const isAdmin = role === "admin" || module === "all";
  const isClosed = stepKey === "closed";

  // ---------- Channel Partner ----------
  if (sheetType === "Channel Partner") {
    if (!isAdmin && module !== "cp") return { visible: false };
    const cat = col(row, 38) === "Yes" ? "can" : "cannot"; // AM = YES/NO
    return { visible: true, route: isClosed ? null : CP_ROUTES[cat][stepKey] || null };
  }

  // ---------- Direct (NBD) ----------
  const doer = col(row, 38);    // AM = BDM
  const fsrDoer = col(row, 39); // AN = FSR

  if (isAdmin) return { visible: true, route: isClosed ? null : NBD_ROUTES[stepKey] || null };

  if (module === "nbd") {
    const tag = NBD_DOER[email] || null;
    if (stepKey === "afterFV" || stepKey === "meeting") {
      if (email === "varun@company.com")
        return fsrDoer === "Varun Sir" ? { visible: true, route: NBD_ROUTES[stepKey] } : { visible: false };
      if (tag) return { visible: false }; // BDMs don't handle these steps (FSR does)
      return { visible: true, route: NBD_ROUTES[stepKey] };
    }
    if (tag && doer !== tag) return { visible: false };
    return { visible: true, route: isClosed ? null : NBD_ROUTES[stepKey] || null };
  }

  if (module === "fsr") {
    const code = FSR_CODES[email] || null;
    if (stepKey === "fieldVisit") return { visible: true, route: FSR_ROUTES.fieldVisit };
    if (stepKey === "afterFV" || stepKey === "meeting" || isClosed) {
      if (!code || fsrDoer !== code) return { visible: false };
      return { visible: true, route: isClosed ? null : FSR_ROUTES[stepKey] };
    }
    return { visible: false }; // FSR has no Step 1 / CNP page
  }

  return { visible: false };
}

// ============================================
// Read sheet (short cache so typing stays fast)
// ============================================
const sheetCache = {};
async function getSheetRows(sheets, sheetName) {
  const c = sheetCache[sheetName];
  if (c && Date.now() - c.time < CACHE_MS) return c.rows;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A8:AN`,
  });
  const rows = response.data.values || [];
  sheetCache[sheetName] = { time: Date.now(), rows };
  return rows;
}

// ============================================
// Match + score (higher = better)
// ============================================
function matchScore(row, term, termDigits, isPhoneSearch) {
  const uniqueId = col(row, 1).toLowerCase();
  const name = col(row, 2).toLowerCase();
  const contactDigits = onlyDigits(row[3]);
  const leadGenName = col(row, 8).toLowerCase();

  if (uniqueId && uniqueId === term) return 100;

  if (isPhoneSearch && termDigits.length >= 3 && contactDigits) {
    const last10 = termDigits.slice(-10);
    if (termDigits.length >= 10 && contactDigits.endsWith(last10)) return 90;
    if (contactDigits.includes(termDigits)) return 60;
    if (termDigits.length > 10 && contactDigits.includes(last10)) return 60;
  }

  if (name) {
    if (name === term) return 80;
    if (name.startsWith(term)) return 70;
    if (name.split(/\s+/).some((w) => w.startsWith(term))) return 60;
    if (name.includes(term)) return 40;
  }
  if (uniqueId && uniqueId.includes(term)) return 50;
  if (leadGenName && leadGenName.includes(term)) return 20;
  return 0;
}

async function searchInSheet(sheets, sheetName, sheetType, user, term) {
  try {
    const rows = await getSheetRows(sheets, sheetName);
    const termLower = term.toLowerCase().trim();
    const termDigits = onlyDigits(term);
    // "98765", "+91 98765-43210" → phone search
    const isPhoneSearch = /^[\d\s+\-()]+$/.test(term.trim());
    const results = [];

    rows.forEach((row, index) => {
      if (!col(row, 1) && !col(row, 2)) return; // empty row
      const score = matchScore(row, termLower, termDigits, isPhoneSearch);
      if (!score) return;

      const step = sheetType === "Direct" ? detectNbdStep(row) : detectCpStep(row);
      const access = getAccess(user, sheetType, step.key, row);
      if (!access.visible) return;

      const info = STEP_INFO[step.key];
      const notInterested = step.status === "Not Interested";
      results.push({
        uniqueId: col(row, 1),
        customerName: col(row, 2),
        customerContact: col(row, 3),
        projectSelection: col(row, 5),
        leadSource: col(row, 6),
        currentStep: info.currentStep,
        stepKey: step.key,
        stepName: info.stepName,
        stepStatus: step.status,
        stepPlannedDate: step.planned,
        stepColor: notInterested ? "#ef4444" : info.stepColor,
        stepIcon: notInterested ? "bi-x-circle-fill" : info.stepIcon,
        canContact: sheetType === "Channel Partner" ? (col(row, 38) === "Yes" ? "Yes" : "No") : "",
        route: access.route || null, // null = closed lead, no page to open
        rowIndex: index + 8,
        sheetName,
        sheetType,
        score,
      });
    });

    return results;
  } catch (error) {
    console.error(`Error searching in ${sheetName}:`, error.message);
    return [];
  }
}

async function searchAll(req, term) {
  const [direct, cp] = await Promise.all([
    searchInSheet(req.sheets, SHEET_NAME, "Direct", req.user, term),
    searchInSheet(req.sheets, CP_LEAD_SHEET, "Channel Partner", req.user, term),
  ]);
  const all = [...direct, ...cp];
  all.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (!!b.route !== !!a.route) return b.route ? 1 : -1; // open leads before closed
    return (a.customerName || "").localeCompare(b.customerName || "");
  });
  return all;
}

// ============================================
// ROUTES
// ============================================

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search term must be at least 2 characters",
      });
    }

    const searchTerm = q.trim();
    const all = await searchAll(req, searchTerm);

    res.json({
      success: true,
      data: all.slice(0, MAX_RESULTS),
      total: all.length,
      searchTerm,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/lead/:uniqueId", async (req, res) => {
  try {
    const { uniqueId } = req.params;
    if (!uniqueId) {
      return res.status(400).json({ success: false, error: "Unique ID is required" });
    }

    const all = await searchAll(req, uniqueId);
    const exactMatch = all.find(
      (r) => r.uniqueId.toLowerCase() === uniqueId.toLowerCase(),
    );

    if (exactMatch) res.json({ success: true, data: exactMatch });
    else res.status(404).json({ success: false, error: "Lead not found" });
  } catch (err) {
    console.error("Lead fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;