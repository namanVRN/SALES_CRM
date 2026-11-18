import { useRef, useState } from "react";
import { toast } from "react-toastify";

// ============================================================
// Shown below the "New Remarks" box:
//  1) "Not Interested Reason" box → saved to the "Reason" column
//     of the "Not Interested Reasons" sheet tab
//     (required only when the lead is marked Not Interested)
//  2) File picker (1 file: image / PDF / audio (mp3, voice note))
//     → uploaded to Google Drive → link saved to the "Link" column
// The file is passed to the parent as: { name, mimeType, size, data (base64) }
// ============================================================

const MAX_SIZE_MB = 5; // Max file size allowed

// Allowed: image, PDF, audio. Checked in code (not with the "accept" attribute),
// because Safari on Mac greys out files whose type it does not recognise.
const ALLOWED_EXT = [
  "jpg", "jpeg", "png", "gif", "webp", "heic", "heif", "bmp",
  "pdf",
  "mp3", "mp4", "m4a", "aac", "wav", "ogg", "opus", "amr", "weba", "caf",
];
const isAllowedFile = (file) => {
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("image/") || type.startsWith("audio/") || type === "application/pdf" || type === "video/mp4") return true;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return ALLOWED_EXT.includes(ext);
};

function ProofFileInput({ value, onChange, reason, onReasonChange, reasonRequired }) {
  const inputRef = useRef(null);
  const [reading, setReading] = useState(false);

  const handleSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedFile(file)) {
      toast.error("Only image, PDF or audio files are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be smaller than ${MAX_SIZE_MB} MB`);
      e.target.value = "";
      return;
    }

    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      // "data:image/png;base64,AAAA..." → keep only "AAAA..."
      const base64 = String(reader.result).split(",")[1] || "";
      onChange({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data: base64,
      });
      setReading(false);
    };
    reader.onerror = () => {
      toast.error("Could not read the file. Please try again.");
      setReading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="form-section" style={{ marginTop: "12px" }}>
      {/* 1) Not Interested Reason → "Reason" column
             (shown only when "Not Interested" is selected) */}
      {onReasonChange && reasonRequired && (
        <div style={{ marginBottom: "14px" }}>
          <label className="form-label-custom">
            <i className="bi bi-question-circle" style={{ color: "#ef4444" }}></i>{" "}
            Not Interested Reason
            <span style={{ color: "#ef4444" }}> *</span>
          </label>
          <textarea
            className="form-input-custom"
            rows={2}
            placeholder="Why is the lead not interested? (e.g. low budget, location too far...)"
            value={reason || ""}
            onChange={(e) => onReasonChange(e.target.value)}
            style={{
              color: "#000",
              backgroundColor: "#fff",
              resize: "vertical",
              width: "100%",
              borderColor: reasonRequired && !reason?.trim() ? "#ef4444" : undefined,
            }}
          ></textarea>
        </div>
      )}

      {/* 2) File (image / voice message) → Google Drive → "Link" column */}
      <label className="form-label-custom">
        <i className="bi bi-paperclip" style={{ color: "#6366f1" }}></i>{" "}
        Attach File (Image / PDF / Audio)
      </label>

      {!value ? (
        <input
          ref={inputRef}
          type="file"
          onChange={handleSelect}
          disabled={reading}
          className="form-input-custom"
          style={{ color: "#000", backgroundColor: "#fff" }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            padding: "8px 12px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            background: "#f8fafc",
            color: "#000",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <i className="bi bi-file-earmark-check" style={{ color: "#10b981" }}></i>{" "}
            {value.name} ({(value.size / 1024).toFixed(0)} KB)
          </span>
          <button
            type="button"
            onClick={handleRemove}
            style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer" }}
          >
            <i className="bi bi-x-circle"></i> Remove
          </button>
        </div>
      )}

      <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
        {reading
          ? "Loading file..."
          : `Max file size: ${MAX_SIZE_MB} MB`}
      </small>
    </div>
  );
}

export default ProofFileInput;