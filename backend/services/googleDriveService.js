const { getDrive } = require("../config/googleAuth");
const { Readable } = require("stream");

const FOLDER_ID = "0ACYEbp3qizyBUk9PVA";

async function uploadPdfToDrive(fileBuffer, fileName) {
  try {
    console.log("📤 Uploading to Drive Folder:", FOLDER_ID);
    console.log("File Name:", fileName);

    // ✅ MUST await — getDrive is async now
    const drive = await getDrive();

    console.log("🔧 Drive client ready, has files:", !!drive?.files);

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [FOLDER_ID],
        mimeType: "application/pdf",
      },
      media: {
        mimeType: "application/pdf",
        body: bufferStream,
      },
      fields: "id, webViewLink",
      supportsAllDrives: true,
    });

    console.log("✅ File uploaded successfully. ID:", response.data.id);

    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });

    console.log("✅ Shareable link:", response.data.webViewLink);
    return response.data.webViewLink;
  } catch (err) {
    console.error("❌ Drive upload error:", err.message);
    console.error("Full error:", err.errors || err);
    throw err;
  }
}

// ============================================
// ✅ Koi bhi file (image / voice message / pdf) Drive pe upload karo
// Same folder me jaati hai jahan Agreement PDFs jaati hain.
// Return: file ka shareable link (anyone with link → view)
// ============================================
async function uploadFileToDrive(fileBuffer, fileName, mimeType) {
  const drive = await getDrive();

  const bufferStream = new Readable();
  bufferStream.push(fileBuffer);
  bufferStream.push(null);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
      mimeType: mimeType || "application/octet-stream",
    },
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: bufferStream,
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: { role: "reader", type: "anyone" },
    supportsAllDrives: true,
  });

  console.log("✅ File uploaded to Drive:", response.data.webViewLink);
  return response.data.webViewLink;
}

module.exports = { uploadPdfToDrive, uploadFileToDrive };