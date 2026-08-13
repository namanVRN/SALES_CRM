

  


// const express = require("express");
// const router = express.Router();

// const CP_SPREADSHEET_ID = process.env.CP_LEAD_FORM_SPREADSHEET_ID;
// const CP_LEAD_SHEET = "Channel Partner FMS";
// const DATA_START_ROW = 8;

// // ============================================
// // Constants
// // ============================================

// // ✅ FINAL statuses - Lead closes, Actual date set होगी
// const FINAL_STATUSES = [
//   "Qualified",
//   "Not Interested",
//   "Not Qualified",
// ];

// // ✅ EXCLUDED from list - ये leads /list में नहीं आएंगी
// const EXCLUDED_STATUSES = new Set([
//   "qualified",
//   "not interested",
//   "not qualified",
// ]);

// // ============================================
// // Helpers
// // ============================================

// function parseDate(dateStr) {
//   if (!dateStr) return new Date(0);
//   const parts = dateStr.split(/[\/\-]/);
//   if (parts.length === 3) {
//     if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
//     return new Date(parts[2], parts[1] - 1, parts[0]);
//   }
//   return new Date(dateStr);
// }

// function formatDateTimeForSheet(input) {
//   if (!input || !input.includes("T")) return "";
//   const [datePart, timePart] = input.split("T");
//   const [year, month, day] = datePart.split("-");
//   return `${day}/${month}/${year} ${timePart}:00`;
// }

// function getCurrentISTTimestamp() {
//   return new Date()
//     .toLocaleString("en-IN", {
//       timeZone: "Asia/Kolkata",
//       hour12: false,
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       second: "2-digit",
//     })
//     .replace(/(\d+)\/(\d+)\/(\d+),/, "$1/$2/$3");
// }

// // ============================================
// // GET /list - Fetch pending leads
// // ============================================
// router.get("/list", async (req, res) => {
//   try {
//     console.log("📊 Fetching CP Lead Form records by STATUS filter only...");

//     const response = await req.sheets.spreadsheets.values.get({
//       spreadsheetId: CP_SPREADSHEET_ID,
//       range: `'${CP_LEAD_SHEET}'!A${DATA_START_ROW}:V`,
//     });

//     const rows = response.data.values || [];
//     const filteredLeads = [];

//     rows.forEach((row, index) => {
//       const uniqueId           = row[1]  || "";
//       const customerName       = row[2]  || "";
//       const customerContact    = row[3]  || "";
//       const interestedIn       = row[4]  || "";
//       const leadGenBy          = row[5]  || "";
//       const leadGenNumber      = row[6]  || "";
//       const leadGenName        = row[7]  || "";
//       const leadRemark         = row[8]  || "";
//       const followUpCountStr   = row[9]  || "0";
//       const planned            = row[10] || "";
//       const actual             = row[11] || "";
//       const status             = row[12] || "";
//       const projectSelection   = row[13] || "";
//       const importantNote      = row[14] || "";
//       const purpose            = row[15] || "";
//       const nextFollowUp       = row[16] || "";
//       const sendWhatsapp       = row[17] || "No";
//       const plannedSiteVisit   = row[18] || "";
//       const remark             = row[19] || "";
//       const notQualifiedReason = row[20] || "";
//       const canContact         = row[21] || "No";

//       const normalizedStatus = status.trim().toLowerCase();
//       const isExcludedStatus = EXCLUDED_STATUSES.has(normalizedStatus);

//       if (!isExcludedStatus) {
//         filteredLeads.push({
//           rowIndex: index + DATA_START_ROW,
//           uniqueId,
//           customerName,
//           contactNumber: customerContact,
//           interestedIn,
//           leadGeneratedBy: leadGenBy,
//           leadGenNumber,
//           leadGenName,
//           leadRemark,
//           followUpCount: parseInt(followUpCountStr) || 0,
//           plannedDate: planned,
//           actualDate: actual,
//           status: status.trim(),
//           projectSelection,
//           importantNote,
//           purpose,
//           nextFollowUp,
//           sendWhatsapp,
//           plannedSiteVisit,
//           remarks: remark,
//           notQualifiedReason,
//           canContact,
//         });
//       }
//     });

//     filteredLeads.sort((a, b) => parseDate(a.plannedDate) - parseDate(b.plannedDate));

//     console.log(`✅ Found ${filteredLeads.length} records after status filter`);

//     res.json({
//       success: true,
//       data: filteredLeads,
//       total: filteredLeads.length,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching CP leads:", error.message);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch leads",
//       message: error.message,
//     });
//   }
// });

// // ============================================
// // POST /update - Update lead based on status
// // ============================================
// router.post("/update", async (req, res) => {
//   try {
//     const {
//       rowIndex,
//       status,
//       remarks = "",
//       projectSelection = "",
//       importantNote = "",
//       purpose = "",
//       plannedSiteVisit = "",
//       sendWhatsapp = "No",
//       whatsappProject = "",
//       alternateWhatsapp = "",
//       nextFollowUp = "",
//       notQualifiedReason = "",
//       canContact = "Yes",
//       currentFollowUpCount = 0,
//     } = req.body;

//     // ✅ Parse rowIndex as number to avoid string comparison bug
//     const rowNum = parseInt(rowIndex, 10);

//     if (!rowNum || isNaN(rowNum) || rowNum < DATA_START_ROW || !status) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid or missing rowIndex / status",
//       });
//     }

//     console.log(`📝 Updating lead row ${rowNum} → Status: ${status}`);

//     const timestamp = getCurrentISTTimestamp();
//     const newFollowUpCount = Number(currentFollowUpCount) + 1;
//     const updates = [];

//     // ============================================
//     // Check if this is a FINAL status
//     // ============================================
//     const isFinalStatus = FINAL_STATUSES.includes(status);

//     console.log(`📌 Status Type: ${isFinalStatus ? "FINAL (will set Actual)" : "INTERMEDIATE (no Actual)"}`);

//     // J - FollowUp Count (always increment)
//     updates.push({
//       range: `'${CP_LEAD_SHEET}'!J${rowNum}`,
//       values: [[newFollowUpCount]],
//     });

//     // M - Status (always update)
//     updates.push({
//       range: `'${CP_LEAD_SHEET}'!M${rowNum}`,
//       values: [[status]],
//     });

//     // R - Send Details on WhatsApp (always update)
//     updates.push({
//       range: `'${CP_LEAD_SHEET}'!R${rowNum}`,
//       values: [[sendWhatsapp]],
//     });

//     // L - Actual Date (ONLY for final statuses)
//     if (isFinalStatus) {
//       updates.push({
//         range: `'${CP_LEAD_SHEET}'!L${rowNum}`,
//         values: [[timestamp]],
//       });
//       console.log(`✅ Setting Actual date: ${timestamp}`);
//     } else {
//       console.log(`⏭️ Skipping Actual date (intermediate status)`);
//     }

//     // T - Remarks
//     let finalRemarks = remarks.trim();

//     if (sendWhatsapp === "Yes" && whatsappProject) {
//       const altNum = alternateWhatsapp.trim() || "Same as main number";
//       const whatsappNote = `WhatsApp Sent: ${whatsappProject} (Alt: ${altNum})`;
//       finalRemarks = finalRemarks ? `${finalRemarks}\n${whatsappNote}` : whatsappNote;
//     }

//     if (finalRemarks) {
//       updates.push({
//         range: `'${CP_LEAD_SHEET}'!T${rowNum}`,
//         values: [[finalRemarks]],
//       });
//     }

//     // ============================================
//     // Status-specific updates
//     // ============================================
//     switch (status) {
//       case "Qualified":
//         if (projectSelection) {
//           updates.push({ range: `'${CP_LEAD_SHEET}'!N${rowNum}`, values: [[projectSelection]] });
//         }
//         if (importantNote) {
//           updates.push({ range: `'${CP_LEAD_SHEET}'!O${rowNum}`, values: [[importantNote]] });
//         }
//         if (purpose) {
//           updates.push({ range: `'${CP_LEAD_SHEET}'!P${rowNum}`, values: [[purpose]] });
//         }
//         if (plannedSiteVisit) {
//           updates.push({ range: `'${CP_LEAD_SHEET}'!S${rowNum}`, values: [[formatDateTimeForSheet(plannedSiteVisit)]] });
//         }
//         if (canContact) {
//           updates.push({ range: `'${CP_LEAD_SHEET}'!V${rowNum}`, values: [[canContact]] });
//         }
//         break;

//       case "Next Followup Required":
//         if (nextFollowUp) {
//           const formatted = formatDateTimeForSheet(nextFollowUp);
//           // Q - Next FollowUp Date
//           updates.push({ range: `'${CP_LEAD_SHEET}'!Q${rowNum}`, values: [[formatted]] });
//           // K - Planned Date (so lead reappears on that date)
//           updates.push({ range: `'${CP_LEAD_SHEET}'!K${rowNum}`, values: [[formatted]] });
//           console.log(`📅 Updated Planned date to: ${formatted}`);
//         }
//         break;

//       case "No Connection Yet":
//         break;

//       case "Not Qualified":
//         if (notQualifiedReason.trim()) {
//           updates.push({ range: `'${CP_LEAD_SHEET}'!U${rowNum}`, values: [[notQualifiedReason]] });
//         }
//         break;

//       case "Not Interested":
//         break;

//       default:
//         return res.status(400).json({
//           success: false,
//           error: `Invalid status value: "${status}"`,
//         });
//     }

//     // ============================================
//     // Execute batch update
//     // ============================================
//     console.log(`📤 Executing ${updates.length} cell updates...`);

//     await req.sheets.spreadsheets.values.batchUpdate({
//       spreadsheetId: CP_SPREADSHEET_ID,
//       requestBody: {
//         valueInputOption: "USER_ENTERED",
//         data: updates.map((u) => ({
//           range: u.range,
//           majorDimension: "ROWS",
//           values: u.values,
//         })),
//       },
//     });

//     console.log(`✅ Lead updated successfully!`);

//     res.json({
//       success: true,
//       message: isFinalStatus
//         ? "Lead closed successfully"
//         : "Lead updated, will appear in next followup",
//       newFollowUpCount,
//       isFinalStatus,
//     });
//   } catch (error) {
//     console.error("❌ Update failed:", error.message);
//     res.status(500).json({
//       success: false,
//       error: "Failed to update lead",
//       message: error.message,
//     });
//   }
// });

// module.exports = router;











const express = require("express");
const router = express.Router();

const CP_SPREADSHEET_ID = process.env.CP_LEAD_FORM_SPREADSHEET_ID;
const CP_LEAD_SHEET = "Channel Partner FMS";
const DATA_START_ROW = 8;

// ============================================
// Constants
// ============================================

// ✅ FINAL statuses - Lead closes
const FINAL_STATUSES = [
  "Qualified",
  "Not Interested",
  "Not Qualified",
];

// ✅ EXCLUDED from list - ये leads /list में नहीं आएंगी
const EXCLUDED_STATUSES = new Set([
  "qualified",
  "not interested",
  "not qualified",
]);

// ============================================
// Helpers
// ============================================

function parseDate(dateStr) {
  if (!dateStr) return new Date(0);
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(dateStr);
}

function formatDateTimeForSheet(input) {
  if (!input || !input.includes("T")) return "";
  const [datePart, timePart] = input.split("T");
  const [year, month, day] = datePart.split("-");
  return `${day}/${month}/${year} ${timePart}:00`;
}

function getCurrentISTTimestamp() {
  return new Date()
    .toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/(\d+)\/(\d+)\/(\d+),/, "$1/$2/$3");
}

// ============================================
// GET /list - Fetch pending leads
// ============================================
router.get("/list", async (req, res) => {
  try {
    console.log("📊 Fetching CP Lead Form records by STATUS filter only...");

    const response = await req.sheets.spreadsheets.values.get({
      spreadsheetId: CP_SPREADSHEET_ID,
      range: `'${CP_LEAD_SHEET}'!A${DATA_START_ROW}:V`,
    });

    const rows = response.data.values || [];
    const filteredLeads = [];

    rows.forEach((row, index) => {
      const uniqueId           = row[1]  || "";
      const customerName       = row[2]  || "";
      const customerContact    = row[3]  || "";
      const interestedIn       = row[4]  || "";
      const leadGenBy          = row[5]  || "";
      const leadGenNumber      = row[6]  || "";
      const leadGenName        = row[7]  || "";
      const leadRemark         = row[8]  || "";
      const followUpCountStr   = row[9]  || "0";
      const planned            = row[10] || "";
      const actual             = row[11] || "";
      const status             = row[12] || "";
      const projectSelection   = row[13] || "";
      const importantNote      = row[14] || "";
      const purpose            = row[15] || "";
      const nextFollowUp       = row[16] || "";
      const sendWhatsapp       = row[17] || "No";
      const plannedSiteVisit   = row[18] || "";
      const remark             = row[19] || "";
      const notQualifiedReason = row[20] || "";
      const canContact         = row[21] || "No";

      const normalizedStatus = status.trim().toLowerCase();
      const isExcludedStatus = EXCLUDED_STATUSES.has(normalizedStatus);

      if (!isExcludedStatus) {
        filteredLeads.push({
          rowIndex: index + DATA_START_ROW,
          uniqueId,
          customerName,
          contactNumber: customerContact,
          interestedIn,
          leadGeneratedBy: leadGenBy,
          leadGenNumber,
          leadGenName,
          leadRemark,
          followUpCount: parseInt(followUpCountStr) || 0,
          plannedDate: planned,
          actualDate: actual,
          status: status.trim(),
          projectSelection,
          importantNote,
          purpose,
          nextFollowUp,
          sendWhatsapp,
          plannedSiteVisit,
          remarks: remark,
          notQualifiedReason,
          canContact,
        });
      }
    });

    filteredLeads.sort((a, b) => parseDate(a.plannedDate) - parseDate(b.plannedDate));

    console.log(`✅ Found ${filteredLeads.length} records after status filter`);

    res.json({
      success: true,
      data: filteredLeads,
      total: filteredLeads.length,
    });
  } catch (error) {
    console.error("❌ Error fetching CP leads:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch leads",
      message: error.message,
    });
  }
});

// ============================================
// POST /update - Update lead based on status
// ============================================
router.post("/update", async (req, res) => {
  try {
    const {
      rowIndex,
      status,
      remarks = "",
      projectSelection = "",
      importantNote = "",
      purpose = "",
      plannedSiteVisit = "",
      sendWhatsapp = "No",
      whatsappProject = "",
      alternateWhatsapp = "",
      nextFollowUp = "",
      notQualifiedReason = "",
      canContact = "Yes",
      currentFollowUpCount = 0,
      currentPlannedDate = "", // ✅ No Connection Yet ke liye
    } = req.body;

    // ✅ Parse rowIndex as number
    const rowNum = parseInt(rowIndex, 10);

    if (!rowNum || isNaN(rowNum) || rowNum < DATA_START_ROW || !status) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing rowIndex / status",
      });
    }

    console.log(`📝 Updating lead row ${rowNum} → Status: ${status}`);

    const timestamp = getCurrentISTTimestamp();
    const newFollowUpCount = Number(currentFollowUpCount) + 1;
    const updates = [];

    const isFinalStatus = FINAL_STATUSES.includes(status);
    console.log(`📌 Status: ${status} | Final: ${isFinalStatus}`);

    // ✅ J - FollowUp Count (always increment)
    updates.push({
      range: `'${CP_LEAD_SHEET}'!J${rowNum}`,
      values: [[newFollowUpCount]],
    });

    // ✅ M - Status (always update)
    updates.push({
      range: `'${CP_LEAD_SHEET}'!M${rowNum}`,
      values: [[status]],
    });

    // ✅ R - Send Details on WhatsApp (always update)
    updates.push({
      range: `'${CP_LEAD_SHEET}'!R${rowNum}`,
      values: [[sendWhatsapp]],
    });

    // ✅ L - Actual Date → HAR STATUS PAR SET HOGI (overwrite every time)
    updates.push({
      range: `'${CP_LEAD_SHEET}'!L${rowNum}`,
      values: [[timestamp]],
    });
    console.log(`✅ Setting Actual date (every status): ${timestamp}`);

    // ✅ T - Remarks
    let finalRemarks = remarks.trim();

    if (sendWhatsapp === "Yes" && whatsappProject) {
      const altNum = alternateWhatsapp.trim() || "Same as main number";
      const whatsappNote = `WhatsApp Sent: ${whatsappProject} (Alt: ${altNum})`;
      finalRemarks = finalRemarks
        ? `${finalRemarks}\n${whatsappNote}`
        : whatsappNote;
    }

    if (finalRemarks) {
      updates.push({
        range: `'${CP_LEAD_SHEET}'!T${rowNum}`,
        values: [[finalRemarks]],
      });
    }

    // ============================================
    // Status-specific updates
    // ============================================
    switch (status) {
      case "Qualified":
        if (projectSelection) {
          updates.push({
            range: `'${CP_LEAD_SHEET}'!N${rowNum}`,
            values: [[projectSelection]],
          });
        }
        if (importantNote) {
          updates.push({
            range: `'${CP_LEAD_SHEET}'!O${rowNum}`,
            values: [[importantNote]],
          });
        }
        if (purpose) {
          updates.push({
            range: `'${CP_LEAD_SHEET}'!P${rowNum}`,
            values: [[purpose]],
          });
        }
        if (plannedSiteVisit) {
          updates.push({
            range: `'${CP_LEAD_SHEET}'!S${rowNum}`,
            values: [[formatDateTimeForSheet(plannedSiteVisit)]],
          });
        }
        if (canContact) {
          updates.push({
            range: `'${CP_LEAD_SHEET}'!V${rowNum}`,
            values: [[canContact]],
          });
        }
        break;

      case "Next Followup Required":
        // ✅ SIRF K column (Planned Date) - Q mein NAHI jayegi
        if (nextFollowUp) {
          const formatted = formatDateTimeForSheet(nextFollowUp);
          updates.push({
            range: `'${CP_LEAD_SHEET}'!K${rowNum}`,
            values: [[formatted]],
          });
          console.log(`📅 Next Followup - K (Planned) updated to: ${formatted}`);
        }
        break;

      // case "No Connection Yet":
      //   // ✅ K column - current planned date + 2 din aage
      //   if (currentPlannedDate) {
      //     const planned = parseDate(currentPlannedDate);
      //     planned.setDate(planned.getDate() + 2);

      //     const dd   = String(planned.getDate()).padStart(2, "0");
      //     const mm   = String(planned.getMonth() + 1).padStart(2, "0");
      //     const yyyy = planned.getFullYear();

      //     // Format: DD/MM/YYYY 10:00:00
      //     const newPlannedFormatted = `${dd}/${mm}/${yyyy} 10:00:00`;

      //     updates.push({
      //       range: `'${CP_LEAD_SHEET}'!K${rowNum}`,
      //       values: [[newPlannedFormatted]],
      //     });
      //     console.log(`📅 No Connection Yet - K updated to: ${newPlannedFormatted}`);
      //   }
      //   break;



      case "No Connection Yet":
  // ✅ K column - current planned date + 2 din aage
  if (currentPlannedDate) {
    // ✅ Pehle time part hata do agar hai
    let cleanDate = currentPlannedDate.trim().split(" ")[0].trim();

    let planned = null;
    const parts = cleanDate.split(/[\/\-]/);

    if (parts.length === 3) {
      const p1 = parseInt(parts[0]);
      const p2 = parseInt(parts[1]);
      const p3 = parseInt(parts[2]);

      if (parts[0].length === 4) {
        // YYYY-MM-DD or YYYY/MM/DD
        planned = new Date(p1, p2 - 1, p3);
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY or DD-MM-YYYY
        planned = new Date(p3, p2 - 1, p1);
      } else {
        // DD/MM/YY → assume 20YY
        planned = new Date(2000 + p3, p2 - 1, p1);
      }
    }

    // Fallback
    if (!planned || isNaN(planned.getTime())) {
      planned = new Date(cleanDate);
    }

    // Final check
    if (!planned || isNaN(planned.getTime())) {
      console.warn(`⚠️ Could not parse planned date: "${currentPlannedDate}"`);
      // Fallback: aaj ki date + 2 din
      planned = new Date();
    }

    planned.setDate(planned.getDate() + 2);

    const dd   = String(planned.getDate()).padStart(2, "0");
    const mm   = String(planned.getMonth() + 1).padStart(2, "0");
    const yyyy = planned.getFullYear();

    const newPlannedFormatted = `${dd}/${mm}/${yyyy} 10:00:00`;

    updates.push({
      range: `'${CP_LEAD_SHEET}'!K${rowNum}`,
      values: [[newPlannedFormatted]],
    });
    console.log(`📅 No Connection Yet - K updated to: ${newPlannedFormatted}`);
  }
  break;


      case "Not Qualified":
        if (notQualifiedReason.trim()) {
          updates.push({
            range: `'${CP_LEAD_SHEET}'!U${rowNum}`,
            values: [[notQualifiedReason]],
          });
        }
        break;

      case "Not Interested":
        // Only L (Actual) sets - already done above
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Invalid status value: "${status}"`,
        });
    }

    // ============================================
    // Execute batch update
    // ============================================
    console.log(`📤 Executing ${updates.length} cell updates...`);

    await req.sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: CP_SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: updates.map((u) => ({
          range: u.range,
          majorDimension: "ROWS",
          values: u.values,
        })),
      },
    });

    console.log(`✅ Lead updated successfully!`);

    res.json({
      success: true,
      message: isFinalStatus
        ? "Lead closed successfully"
        : "Lead updated, will appear in next followup",
      newFollowUpCount,
      isFinalStatus,
    });
  } catch (error) {
    console.error("❌ Update failed:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to update lead",
      message: error.message,
    });
  }
});

module.exports = router;