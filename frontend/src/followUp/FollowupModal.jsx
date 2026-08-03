import { useState } from "react";
import { submitFollowupAction } from "../services/fmsApi";
import { toast } from "react-toastify";
import "../assets/styles/ActionModal.css";

function FollowupModal({ row, onClose, onSuccess }) {
  const [status, setStatus] = useState(row.colI || "");
  const [contactPerson, setContactPerson] = useState(row.colB || "");
  const [rera, setRera] = useState(row.colK || "");
  const [remark, setRemark] = useState(row.colL || "");
  const [days, setDays] = useState(row.colM || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!status) {
      toast.warning("Please select a status");
      return;
    }

    setSaving(true);

    const payload = {
      rowNumber: row.rowNumber,
      status,
      contactPerson,
      rera,
      remark,
      days: status === "Agreed to next meeting" ? days : "",
    };

    const res = await submitFollowupAction(payload);

    setSaving(false);

    if (res.success) {
      toast.success("Follow-up updated successfully");
      onClose();
      onSuccess();
    } else {
      toast.error("Failed to update. Please try again.");
    }
  };

  const statusOptions = [
    { value: "Call Again", label: "Call Again", icon: "bi-telephone-forward", color: "#8b5cf6" },
    { value: "Agreed to next meeting", label: "Agreed to Meeting", icon: "bi-calendar-check", color: "#10b981" },
    { value: "Not interested", label: "Not Interested", icon: "bi-x-circle", color: "#ef4444" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-custom" style={{ background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)" }}>
          <div className="modal-header-content">
            <div className="modal-icon">
              <i className="bi bi-chat-dots-fill"></i>
            </div>
            <div className="modal-header-text">
              <h2>Follow-up Action</h2>
              <div className="modal-subtitle">
                <span className="firm-badge">
                  <i className="bi bi-building"></i>
                  {row.colB || "Unknown Firm"}
                </span>
                {row.colC && (
                  <span className="contact-badge">
                    <i className="bi bi-telephone"></i>
                    {row.colC}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-custom">
          <form>
            {/* Status Selection */}
            <div className="form-section">
              <label className="form-label-custom">
                <i className="bi bi-tag-fill" style={{ color: "#ec4899" }}></i>
                Status <span className="required">*</span>
              </label>
              <div className="status-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`status-option ${status === option.value ? "active" : ""}`}
                    onClick={() => setStatus(option.value)}
                    style={{ "--option-color": option.color }}
                  >
                    <i className={`bi ${option.icon}`}></i>
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Person Name */}
            <div className="form-section">
              <label className="form-label-custom">
                <i className="bi bi-person-fill" style={{ color: "#ec4899" }}></i>
                Contact Person Name
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className="form-input-custom"
                  placeholder="Enter contact person name"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}

                  style={{
                    color: "#000",
                    backgroundColor: "#fff",
                    border: "1px solid #ec4899",
                    boxShadow: "0 0 0 1px rgba(236,72,153,0.3)",
                    outline: "none"
                  }}

                  onFocus={(e) => {
                    e.target.style.border = "1px solid #ec4899";
                    e.target.style.boxShadow = "0 0 0 2px rgba(236,72,153,0.4)";
                  }}

                  onBlur={(e) => {
                    e.target.style.border = "1px solid #ec4899";
                    e.target.style.boxShadow = "0 0 0 1px rgba(236,72,153,0.3)";
                  }}
                />


              </div>
            </div>

            {/* RERA Registered */}
            <div className="form-section">
              <label className="form-label-custom">
                <i className="bi bi-card-checklist" style={{ color: "#ec4899" }}></i>
                RERA Registered
              </label>
              <div className="toggle-group">
                <div
                  className={`toggle-option ${rera === "Yes" ? "active yes" : ""}`}
                  onClick={() => setRera("Yes")}
                >
                  <i className="bi bi-check-lg"></i>
                  Yes
                </div>
                <div
                  className={`toggle-option ${rera === "No" ? "active no" : ""}`}
                  onClick={() => setRera("No")}
                >
                  <i className="bi bi-x-lg"></i>
                  No
                </div>
              </div>
            </div>

            {/* Remark */}
            <div className="form-section">
              <label className="form-label-custom">
                <i className="bi bi-chat-square-text-fill" style={{ color: "#ec4899" }}></i>
                Remark
              </label>
              <div className="textarea-wrapper">
                <textarea
                  className="form-textarea-custom"
                  placeholder="Add remarks or notes..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
            </div>

            {/* Conditional Date for Meeting */}
            {status === "Agreed to next meeting" && (
              <div className="form-section meeting-date-section">
                <label className="form-label-custom">
                  <i className="bi bi-calendar-event-fill" style={{ color: "#10b981" }}></i>
                  Date for the Meeting <span className="required">*</span>
                </label>

                <div className="input-wrapper">
                  <input
                    type="date"
                    className="form-input-custom"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}

                    /* 👇 Inline Fix */
                    style={{
                      color: "#000",
                      backgroundColor: "#fff"
                    }}
                  />
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer-custom">
          <button className="btn-cancel" onClick={onClose}>
            <i className="bi bi-x-circle"></i>
            Cancel
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle-fill"></i>
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FollowupModal;