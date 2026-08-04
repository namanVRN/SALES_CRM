// const express = require("express");
// const router = express.Router();

// const SPREADSHEET_ID = "11jn0gY-gHH0nyxM73uJJlhV-N40pCks9CVYG84VFkqM";
// const SHEET_NAME = "MASTER";

// // GET today's birthdays
// router.get("/today", async (req, res) => {
//   try {
//     const { bdmName } = req.query; // Frontend se BDM ka naam aayega

//     // Fetch data from sheet
//     const response = await req.sheets.spreadsheets.values.get({
//       spreadsheetId: SPREADSHEET_ID,
//       range: `${SHEET_NAME}!A2:H1000`,
//     });

//     const rows = response.data.values || [];

//     // Today's date (day/month)
//     const today = new Date();
//     const todayDay = today.getDate();
//     const todayMonth = today.getMonth() + 1;

//     // Filter birthdays
//     const birthdays = rows
//       .map((row, index) => ({
//         rowIndex: index + 2,
//         date: row[0] || "",
//         name: row[1] || "",
//         phone: row[2] || "",
//         teamMember: row[3] || "",
//         dealType: row[4] || "",
//         uniqueId: row[5] || "",
//         dob: row[6] || "",
//         status: row[7] || "",
//       }))
//       .filter((cp) => {
//         // Skip if no DOB
//         if (!cp.dob) return false;

//         // Parse DOB (format: DD/MM/YYYY)
//         const dobParts = cp.dob.split("/");
//         if (dobParts.length !== 3) return false;

//         const dobDay = parseInt(dobParts[0]);
//         const dobMonth = parseInt(dobParts[1]);

//         // Check if today's birthday
//         const isBirthdayToday = dobDay === todayDay && dobMonth === todayMonth;

//         // Filter by BDM name if provided
//         if (bdmName && isBirthdayToday) {
//           return cp.teamMember.toLowerCase().trim() === bdmName.toLowerCase().trim();
//         }

//         return isBirthdayToday;
//       });

//     res.json({
//       success: true,
//       count: birthdays.length,
//       birthdays: birthdays,
//       today: `${todayDay}/${todayMonth}`,
//     });
//   } catch (err) {
//     console.error("❌ Birthday fetch error:", err.message);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// });

// // GET this month's birthdays
// router.get("/this-month", async (req, res) => {
//   try {
//     const { bdmName } = req.query;

//     const response = await req.sheets.spreadsheets.values.get({
//       spreadsheetId: SPREADSHEET_ID,
//       range: `${SHEET_NAME}!A2:H1000`,
//     });

//     const rows = response.data.values || [];
//     const currentMonth = new Date().getMonth() + 1;

//     const birthdays = rows
//       .map((row, index) => ({
//         rowIndex: index + 2,
//         date: row[0] || "",
//         name: row[1] || "",
//         phone: row[2] || "",
//         teamMember: row[3] || "",
//         dealType: row[4] || "",
//         uniqueId: row[5] || "",
//         dob: row[6] || "",
//         status: row[7] || "",
//       }))
//       .filter((cp) => {
//         if (!cp.dob) return false;
//         const dobParts = cp.dob.split("/");
//         if (dobParts.length !== 3) return false;

//         const dobMonth = parseInt(dobParts[1]);
//         const isThisMonth = dobMonth === currentMonth;

//         if (bdmName && isThisMonth) {
//           return cp.teamMember.toLowerCase().trim() === bdmName.toLowerCase().trim();
//         }
//         return isThisMonth;
//       })
//       .sort((a, b) => {
//         const dayA = parseInt(a.dob.split("/")[0]);
//         const dayB = parseInt(b.dob.split("/")[0]);
//         return dayA - dayB;
//       });

//     res.json({
//       success: true,
//       count: birthdays.length,
//       birthdays: birthdays,
//     });
//   } catch (err) {
//     console.error("❌ Monthly birthday fetch error:", err.message);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// });



// // Debug route - shows all CPs
// router.get("/debug", async (req, res) => {
//   try {
//     const response = await req.sheets.spreadsheets.values.get({
//       spreadsheetId: SPREADSHEET_ID,
//       range: `${SHEET_NAME}!A2:H1000`,
//     });

//     const rows = response.data.values || [];
//     const today = new Date();
    
//     const allCPs = rows.map((row, index) => ({
//       row: index + 2,
//       name: row[1] || "",
//       teamMember: row[3] || "EMPTY",
//       dob: row[6] || "NO_DOB",
//     }));

//     const withDOB = allCPs.filter(cp => cp.dob !== "NO_DOB");

//     res.json({
//       today: `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`,
//       totalCPs: allCPs.length,
//       cpsWithDOB: withDOB.length,
//       allWithDOB: withDOB,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;




const express = require("express");
const router = express.Router();

const SPREADSHEET_ID = "11jn0gY-gHH0nyxM73uJJlhV-N40pCks9CVYG84VFkqM";
const SHEET_NAME = "MASTER";

// ✅ BDM Email → Name Mapping
const BDM_EMAIL_TO_NAME = {
  "bdm1@company.com": ["nbd bdm", "bdm1"],
  "bdm2@company.com": ["cp bdm", "bdm2"],
  "bdm3@company.com": ["arham khan", "arham", "bdm3"],
  "admin@company.com": ["admin"], // Admin ka mapping
};

// Helper: Get BDM names from email
const getBDMNames = (email) => {
  if (!email) return [];
  return BDM_EMAIL_TO_NAME[email.toLowerCase()] || [];
};

router.get("/today", async (req, res) => {
  try {
    const { bdmEmail, isAdmin } = req.query;
    
    console.log("🔍 BDM Email:", bdmEmail);
    console.log("🔍 Is Admin:", isAdmin);

    const response = await req.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:H1000`,
    });

    const rows = response.data.values || [];
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1;

    // Get BDM names from email
    const bdmNames = getBDMNames(bdmEmail);
    console.log("🔍 BDM Names:", bdmNames);

    const birthdays = rows
      .map((row, index) => ({
        rowIndex: index + 2,
        date: row[0] || "",
        name: row[1] || "",
        phone: row[2] || "",
        teamMember: row[3] || "",
        dealType: row[4] || "",
        uniqueId: row[5] || "",
        dob: row[6] || "",
        status: row[7] || "",
      }))
      .filter((cp) => {
        if (!cp.dob) return false;
        const dobParts = cp.dob.split("/");
        if (dobParts.length !== 3) return false;

        const dobDay = parseInt(dobParts[0]);
        const dobMonth = parseInt(dobParts[1]);
        const isBirthdayToday = dobDay === todayDay && dobMonth === todayMonth;

        if (!isBirthdayToday) return false;

        // Admin - sab dikhao
        if (isAdmin === "true") return true;

        // BDM - unke assigned CPs + empty team member wale dikhao
        const teamMemberLower = cp.teamMember.toLowerCase().trim();
        
        // Empty team member → show to all BDMs
        if (teamMemberLower === "") return true;
        
        // Match if team member is in BDM's known names
        return bdmNames.some(name => 
          teamMemberLower === name.toLowerCase().trim()
        );
      });

    console.log("🔍 Total birthdays found:", birthdays.length);

    res.json({
      success: true,
      count: birthdays.length,
      birthdays: birthdays,
      today: `${todayDay}/${todayMonth}`,
    });
  } catch (err) {
    console.error("❌ Birthday fetch error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Debug route
router.get("/debug", async (req, res) => {
  try {
    const response = await req.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:H1000`,
    });

    const rows = response.data.values || [];
    const today = new Date();

    const allCPs = rows.map((row, index) => ({
      row: index + 2,
      name: row[1] || "",
      teamMember: row[3] || "EMPTY",
      dob: row[6] || "NO_DOB",
    }));

    const withDOB = allCPs.filter(cp => cp.dob !== "NO_DOB");

    res.json({
      today: `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`,
      totalCPs: allCPs.length,
      cpsWithDOB: withDOB.length,
      allWithDOB: withDOB,
      bdmMapping: BDM_EMAIL_TO_NAME,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;