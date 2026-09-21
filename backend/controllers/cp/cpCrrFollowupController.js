const { getCurrentTimestamp } = require("../../utils/dateUtils");

const SPREADSHEET_ID =
  process.env.CP_CRR_FOLLOWUP_SPREADSHEET_ID ||
  "1HHC6pRokxdGEH3xF0ppBHBpd9cn6OvL750kQpQnzySU";

const GET_SHEET_NAME = "Master";
const POST_SHEET_NAME = "Consolidated"; // ✅ Aapki sheet ka naam
const DATA_START_ROW = 2;

// Helper: Timestamp format (DD/MM/YYYY HH:mm:ss)
function getFormattedTimestamp() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
}

// ==========================================
// GET — Fetch pending followups from Master
// ==========================================
const getCrrFollowupList = async (req, res) => {
  try {
    const response = await req.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${GET_SHEET_NAME}!A${DATA_START_ROW}:M`,
      valueRenderOption: "FORMATTED_VALUE",
    });

    const rows = response.data.values || [];
    const list = [];

    rows.forEach((row, idx) => {
      const doer = (row[0] || "").toString().trim();
      const taskId = (row[3] || "").toString().trim();
      const freq = (row[4] || "").toString().trim();
      const channelPartner = (row[5] || "").toString().trim();
      const planned = (row[6] || "").toString().trim();
      const colH = (row[7] || "").toString().trim();
      const status = (row[8] || "Pending").toString().trim();
      const phoneNumber = (row[12] || "").toString().trim();

      // Filter: Column G me data ho AND Column H khali ho
      if (planned !== "" && colH === "") {
        list.push({
          rowNumber: DATA_START_ROW + idx,
          taskId,
          doer,
          planned,
          channelPartner,
          freq,
          phoneNumber,
          status: status || "Pending",
        });
      }
    });

    res.json({
      success: true,
      pendingCount: list.length,
      data: list,
    });
  } catch (err) {
    console.error("❌ CRR Followup GET Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// POST — Process Done Action
// ==========================================
const markCrrFollowupDone = async (req, res) => {
  try {
    const { taskId, channelPartner, remark, leadDetails } = req.body;

    if (!taskId) {
      return res
        .status(400)
        .json({ success: false, message: "taskId is required" });
    }

    const timestamp = getFormattedTimestamp();
    const status = "Done";

    // ----------------------------------------------------
    // STEP 1: Consolidated Sheet ke bilkul AAKHRI Row me write karna
    // ----------------------------------------------------
    const sheetDataRes = await req.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${POST_SHEET_NAME}'!A:A`, // Fetch all Column A rows
    });

    const colAValues = sheetDataRes.data.values || [];
    // Total existing rows + 1 = Sabse aakhri khali row!
    const absoluteNextRow = colAValues.length + 1;

    const newRow = [
      taskId,
      timestamp,
      remark || "",
      leadDetails || "",
      status,
      channelPartner || "",
    ];

    // Direct targeted bottom row par update karega
    await req.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${POST_SHEET_NAME}'!A${absoluteNextRow}:F${absoluteNextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [newRow],
      },
    });

    // ----------------------------------------------------
    // STEP 2: Master Sheet me Task ID match karke H aur I update karna
    // ----------------------------------------------------
    const masterRes = await req.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${GET_SHEET_NAME}!D1:D`,
    });

    const taskIdsList = masterRes.data.values || [];
    let matchedRowIndex = -1;

    for (let i = 0; i < taskIdsList.length; i++) {
      if (
        (taskIdsList[i][0] || "").toString().trim() ===
        taskId.toString().trim()
      ) {
        matchedRowIndex = i + 1;
        break;
      }
    }

    if (matchedRowIndex !== -1) {
      await req.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${GET_SHEET_NAME}!H${matchedRowIndex}:I${matchedRowIndex}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[timestamp, status]],
        },
      });
    }

    res.json({
      success: true,
      message:
        "Task marked as Done successfully! Added to the absolute bottom of Consolidated sheet.",
    });
  } catch (err) {
    console.error("❌ CRR Followup POST Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getCrrFollowupList,
  markCrrFollowupDone,
};