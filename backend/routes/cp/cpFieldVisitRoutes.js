const express = require("express");
const router = express.Router();

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CP_SHEET_NAME = "Channel Partner Lead FMS";
const FSR_OPTIONS = new Set([
  "BDM4",
  "BDM5",
  "BDM8",
  "BDM9",
  "BDM11",
  "BDM12",
  "BDM13",
  "BDM14",
  "Self",
]);
// ============================================
// ✅ CP Not Interested → "Not Interested Reasons" tab (NBD jaisa hi)
// Headers: Timestamp | Step | Unique ID | Customer Name | Contact |
//          Interested In | Project | Lead Source | Doer | Reason | Updated By | Link
// ============================================
const jwt = require("jsonwebtoken");
const { uploadFileToDrive } = require("../../services/googleDriveService");
const NOT_INTERESTED_SHEET = "Not Interested Reasons";

// CP routes pe login check nahi hai, isliye token se user nikaalo (mile to)
function getUserFromToken(req) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    return token ? jwt.verify(token, process.env.JWT_SECRET) : null;
  } catch (e) {
    return null;
  }
}

async function appendToNotInterestedSheet(req, rowIndex, stepName, reason, proofFile) {
  try {
    // Lead ki details "Channel Partner Lead FMS" ki usi row se (B se G)
    const leadRes = await req.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CP_SHEET_NAME}'!A${rowIndex}:G${rowIndex}`,
    });
    const r = leadRes.data.values?.[0] || [];
    const user = getUserFromToken(req);

    // Remark ke neeche chuni gayi file (image / voice msg) → Google Drive → link
    let fileLink = "";
    if (proofFile && proofFile.data) {
      try {
        const buffer = Buffer.from(proofFile.data, "base64");
        const safeName = String(proofFile.name || "file").replace(/[^\w.\-]/g, "_");
        fileLink = await uploadFileToDrive(
          buffer,
          `NI_${r[1] || "lead"}_${Date.now()}_${safeName}`,
          proofFile.mimeType,
        );
      } catch (e) {
        console.error("❌ NI file Drive upload failed:", e.message);
      }
    }

    await req.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${NOT_INTERESTED_SHEET}'!A:L`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          [
            getCurrentTimestamp(), // Timestamp
            stepName,              // Step
            r[1] || "",            // Unique ID
            r[2] || "",            // Customer Name
            r[3] || "",            // Contact
            r[4] || "",            // Interested In
            r[5] || "",            // Project
            r[6] || "",            // Lead Source
            user?.name || "",      // Doer
            reason || "",          // Reason
            user?.email || "",     // Updated By
            fileLink,              // Link (Drive file)
          ],
        ],
      },
    });
  } catch (error) {
    console.error("❌ CP Not Interested sheet append failed:", error.message);
  }
}

// ======================================================
// HELPERS
// ======================================================

function getCurrentTimestamp() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function getPlannedDateTime(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("T")) {
    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-");
    return `${day}/${month}/${year} ${timePart}:00`;
  }
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  let formattedDate = dateStr;
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts[0].length === 4) {
      formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return `${formattedDate} ${hours}:${minutes}:${seconds}`;
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split(/[/-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(dateStr);
}

// ======================================================
// READ DATA - CP Field Visit with Category Filter
// ======================================================

async function getFilteredCPLeads(sheets, category) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${CP_SHEET_NAME}'!A8:AM`,
    });

    const rows = response.data.values || [];
    const filteredLeads = [];

    rows.forEach((row, index) => {
      const importantNote = row[10] ? row[10].trim() : "";
      const plannedDate = row[20] ? row[20].trim() : "";
      const actualDate = row[21] ? row[21].trim() : "";
      const status = row[22] ? row[22].trim() : "";
      const oldRemarks = row[11] ? row[11].trim() : "";
      const previousRemarksDate = row[13] ? row[13].trim() : "";
      const previousRemarks = row[19] ? row[19].trim() : "";
      const latestRemarks = row[24] ? row[24].trim() : "";
      const followupCount = row[25] ? parseInt(row[25].trim(), 10) || 0 : 0;
      const canContact = row[38] ? row[38].trim() : "";

      const categoryMatch =
        (category === "can-contact" && canContact === "Yes") ||
        (category === "cannot-contact" && (canContact === "No" || canContact === ""));
      if (!categoryMatch) return;

      let displayRemarks = "";
      if (latestRemarks) {
        displayRemarks = latestRemarks;
      } else if (previousRemarks) {
        displayRemarks = previousRemarks;
      } else if (oldRemarks) {
        displayRemarks = oldRemarks;
      }

      // ✅ Show: empty, Rescheduled, No Connection
      const statusLower = status.trim().toLowerCase();
      const showRow = !status || statusLower === "rescheduled" || statusLower === "no connection";

      if (showRow && plannedDate) {
        filteredLeads.push({
          rowIndex: index + 8,
          sheetName: CP_SHEET_NAME,
          uniqueId: row[1] || "",
          customerName: row[2] || "",
          customerContact: row[3] || "",
          interestedIn: row[4] || "",
          projectSelection: row[5] || "",
          leadSource: row[6] || "",
          leadGenNumber: row[7] || "",
          leadGenName: row[8] || "",
          importantNote,
          plannedDate,
          status: status || "Pending",
          followupCount,
          remarks: displayRemarks,
          oldRemarks,
          previousRemarks,
          previousRemarksDate,
          canContact,
        });
      }
    });

    return filteredLeads;
  } catch (error) {
    console.error(`Error fetching CP Field Visit (${category}):`, error.message);
    throw error;
  }
}

// ======================================================
// GET ENDPOINTS
// ======================================================

router.get("/can-contact/list", async (req, res) => {
  try {
    console.log("📊 Fetching CP Can Contact Field Visit data...");
    const leads = await getFilteredCPLeads(req.sheets, "can-contact");
    leads.sort((a, b) => parseDate(a.plannedDate) - parseDate(b.plannedDate));
    res.json({ success: true, data: leads, total: leads.length, category: "can-contact" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leads", message: error.message });
  }
});

router.get("/cannot-contact/list", async (req, res) => {
  try {
    console.log("📊 Fetching CP Cannot Contact Field Visit data...");
    const leads = await getFilteredCPLeads(req.sheets, "cannot-contact");
    leads.sort((a, b) => parseDate(a.plannedDate) - parseDate(b.plannedDate));
    res.json({ success: true, data: leads, total: leads.length, category: "cannot-contact" });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch leads", message: error.message });
  }
});

// ======================================================
// POST - Can Contact Update
// ======================================================

router.post("/can-contact/update", async (req, res) => {
  try {
    const { rowIndex, status, remarks, rescheduleDate, fsr } = req.body;
    const isDone = (!status || status === "Done") && !rescheduleDate;
    const fsrValue = typeof fsr === "string" ? fsr.trim() : "";

    if (isDone && !FSR_OPTIONS.has(fsrValue)) {
      return res.status(400).json({ success: false, error: "A valid FSR is required" });
    }

    console.log("📝 CP Can Contact Field Visit Update:", { rowIndex, status, rescheduleDate, remarks });

    if (!rowIndex) {
      return res.status(400).json({ success: false, error: "Missing rowIndex" });
    }

    const updates = [];
    const timestamp = getCurrentTimestamp();

    // Fetch current Followup Count
    let currentFollowupCount = 0;
    try {
      const countResponse = await req.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${CP_SHEET_NAME}'!Z${rowIndex}`,
      });
      const val = countResponse.data.values?.[0]?.[0];
      currentFollowupCount = val ? parseInt(String(val).trim(), 10) || 0 : 0;
    } catch (e) {
      console.warn(`⚠️ Could not read followup count:`, e.message);
    }

    const newFollowupCount = currentFollowupCount + 1;

    // Always increment Followup Count
    updates.push({
      range: `'${CP_SHEET_NAME}'!Z${rowIndex}`,
      values: [[newFollowupCount]],
    });

    // ✅ No Connection — planned date override + status "No Connection"
    if (status === "No Connection" && rescheduleDate && String(rescheduleDate).trim() !== "") {
      const newPlannedDateTime = getPlannedDateTime(rescheduleDate);
      updates.push({
        range: `'${CP_SHEET_NAME}'!U${rowIndex}`,
        values: [[newPlannedDateTime]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [["No Connection"]],
      });
    } else if (rescheduleDate && String(rescheduleDate).trim() !== "") {
      // Reschedule
      const newPlannedDateTime = getPlannedDateTime(rescheduleDate);
      updates.push({
        range: `'${CP_SHEET_NAME}'!U${rowIndex}`,
        values: [[newPlannedDateTime]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [["Rescheduled"]],
      });
    } else if (status === "Not Interested") {
      updates.push({
        range: `'${CP_SHEET_NAME}'!V${rowIndex}`,
        values: [[timestamp]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [["Not Interested"]],
      });
    } else {
      updates.push({
        range: `'${CP_SHEET_NAME}'!V${rowIndex}`,
        values: [[timestamp]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [[status || "Done"]],
      });
      if (isDone) {
        updates.push({
          range: `'${CP_SHEET_NAME}'!AN${rowIndex}`,
          values: [[fsrValue]],
        });
      }
    }

    // Remarks
    if (remarks && String(remarks).trim() !== "") {
      updates.push({
        range: `'${CP_SHEET_NAME}'!Y${rowIndex}`,
        values: [[String(remarks).trim()]],
      });
    }

    await req.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data: updates },
    });

    console.log(`✅ CP Can Contact Field Visit updated: Row ${rowIndex}`);

    // ✅ CP Not Interested → 'Not Interested Reasons' tab
    if (status === "Not Interested") {
      await appendToNotInterestedSheet(req, rowIndex, "CP - Step 2 - Field Visit", req.body.notInterestedReason || remarks, req.body.proofFile);
    }
    res.json({
      success: true,
      message: status === "No Connection"
        ? "Marked as No Connection"
        : rescheduleDate
        ? "Visit Rescheduled successfully"
        : status === "Not Interested"
          ? "Marked as Not Interested"
          : "Field Visit marked as Done",
      newFollowupCount,
    });
  } catch (error) {
    console.error("❌ Update failed:", error.message);
    res.status(500).json({ success: false, error: "Failed to update lead", message: error.message });
  }
});

// ======================================================
// POST - Cannot Contact Update
// ======================================================

router.post("/cannot-contact/update", async (req, res) => {
  try {
    const { rowIndex, status, remarks, rescheduleDate, fsr } = req.body;
    const isDone = (!status || status === "Done") && !rescheduleDate;
    const fsrValue = typeof fsr === "string" ? fsr.trim() : "";

    if (isDone && !FSR_OPTIONS.has(fsrValue)) {
      return res.status(400).json({ success: false, error: "A valid FSR is required" });
    }

    console.log("📝 CP Cannot Contact Field Visit Update:", { rowIndex, status, rescheduleDate, remarks });

    if (!rowIndex) {
      return res.status(400).json({ success: false, error: "Missing rowIndex" });
    }

    const updates = [];
    const timestamp = getCurrentTimestamp();

    // Fetch current Followup Count
    let currentFollowupCount = 0;
    try {
      const countResponse = await req.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${CP_SHEET_NAME}'!Z${rowIndex}`,
      });
      const val = countResponse.data.values?.[0]?.[0];
      currentFollowupCount = val ? parseInt(String(val).trim(), 10) || 0 : 0;
    } catch (e) {
      console.warn(`⚠️ Could not read followup count:`, e.message);
    }

    const newFollowupCount = currentFollowupCount + 1;

    updates.push({
      range: `'${CP_SHEET_NAME}'!Z${rowIndex}`,
      values: [[newFollowupCount]],
    });

    // ✅ No Connection — planned date override + status "No Connection"
    if (status === "No Connection" && rescheduleDate && String(rescheduleDate).trim() !== "") {
      const newPlannedDateTime = getPlannedDateTime(rescheduleDate);
      updates.push({
        range: `'${CP_SHEET_NAME}'!U${rowIndex}`,
        values: [[newPlannedDateTime]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [["No Connection"]],
      });
    } else if (rescheduleDate && String(rescheduleDate).trim() !== "") {
      // Reschedule
      const newPlannedDateTime = getPlannedDateTime(rescheduleDate);
      updates.push({
        range: `'${CP_SHEET_NAME}'!U${rowIndex}`,
        values: [[newPlannedDateTime]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [["Rescheduled"]],
      });
    } else if (status === "Not Interested") {
      updates.push({
        range: `'${CP_SHEET_NAME}'!V${rowIndex}`,
        values: [[timestamp]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [["Not Interested"]],
      });
    } else {
      updates.push({
        range: `'${CP_SHEET_NAME}'!V${rowIndex}`,
        values: [[timestamp]],
      });
      updates.push({
        range: `'${CP_SHEET_NAME}'!W${rowIndex}`,
        values: [[status || "Done"]],
      });
      if (isDone) {
        updates.push({
          range: `'${CP_SHEET_NAME}'!AN${rowIndex}`,
          values: [[fsrValue]],
        });
      }
    }

    // Remarks
    if (remarks && String(remarks).trim() !== "") {
      updates.push({
        range: `'${CP_SHEET_NAME}'!Y${rowIndex}`,
        values: [[String(remarks).trim()]],
      });
    }

    await req.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data: updates },
    });

    console.log(`✅ CP Cannot Contact Field Visit updated: Row ${rowIndex}`);

    // ✅ CP Not Interested → 'Not Interested Reasons' tab
    if (status === "Not Interested") {
      await appendToNotInterestedSheet(req, rowIndex, "CP - Step 2 - Field Visit", req.body.notInterestedReason || remarks, req.body.proofFile);
    }

    res.json({
      success: true,
      message: status === "No Connection"
        ? "Marked as No Connection"
        : rescheduleDate
        ? "Visit Rescheduled successfully"
        : status === "Not Interested"
          ? "Marked as Not Interested"
          : "Field Visit marked as Done",
      newFollowupCount,
    });
  } catch (error) {
    console.error("❌ Update failed:", error.message);
    res.status(500).json({ success: false, error: "Failed to update lead", message: error.message });
  }
});

module.exports = router;