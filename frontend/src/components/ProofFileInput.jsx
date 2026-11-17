import { useRef, useState } from "react";
import { toast } from "react-toastify";

// ============================================================
// Shown below the "New Remarks" box:
//  1) "Not Interested Reason" box → saved to the "Reason" column
//     of the "Not Interested Reasons" sheet tab
//     (required only when the lead is marked Not Interested)
//  2) File picker (1 file: image / screenshot / voice message)
//     → uploaded to Google Drive → link saved to the "Link" column
// The file is passed to the parent as: { name, mimeType, size, data (base64) }
// ============================================================

const MAX_SIZE_MB = 5; // Max file size allowed

function ProofFileInput({ value, onChange, reason, onReasonChange, reasonRequired }) {
  const inputRef = useRef(null);
  const [reading, setReading] = useState(false);

  const handleSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        Attach File (Image / Voice Message)
      </label>

      {!value ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/*,audio/*,.opus,.ogg,.m4a,.pdf"
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