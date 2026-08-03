import { useState } from "react";
import { submitCallToBrokerAction } from "../services/fmsApi";
import { toast } from "react-toastify";
import "../assets/styles/ActionModal.css";

function ActionModal({ row, onClose, onSuccess }) {
  const [status, setStatus] = useState(row.colJ || "");
  const [leadQualified, setLeadQualified] = useState(row.colK || "");
  const [contactPerson, setContactPerson] = useState(row.colB || "");
  const [rera, setRera] = useState(row.colM || "");
  const [remark, setRemark] = useState(row.colN || "");
  const [days, setDays] = useState(row.colQ || "");
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
      leadQualified,
      contactPerson,
      rera,
      remark,
      days: status === "Agreed to next meeting" ? days : "",
      actualDate: new Date().toISOString(),
    };

    const res = await submitCallToBrokerAction(payload);

    setSaving(false);

    if (res.success) {
      toast.success("Record updated successfully");
      onClose();
      onSuccess();
    } else {
      toast.error("Something went wrong");
    }
  };

  const statusOptions = [
    { value: "CRR", label: "CRR", icon: "bi-arrow-repeat", color: "#6366f1" },
    {
      value: "Not interested",
      label: "Not Interested",
      icon: "bi-x-circle",
      color: "#ef4444",
    },
    {
      value: "Not Eligible",
      label: "Not Eligible",
      icon: "bi-slash-circle",
      color: "#f97316",
    },
    {
      value: "Agreed to next meeting",
      label: "Agreed to Meeting",
      icon: "bi-calendar-check",
      color: "#10b981",
    },
    {
      value: "Call Again",
      label: "Call Again",
      icon: "bi-telephone-forward",
      color: "#8b5cf6",
    },
    {
      value: "No Connection",
      label: "No Connection (15+ Days)",
      icon: "bi-wifi-off",
      color: "#0ea5e9",
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-custom">
          <div className="modal-header-content">
            <div className="modal-icon">
              <i className="bi bi-pencil-square"></i>
            </div>
            <div className="modal-header-text">
              <h2>Update Call to Broker</h2>
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
                <i className="bi bi-tag-fill"></i>
                Status <span className="required">*</span>
              </label>
              <div className="status-grid">
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

            {/* Lead Qualified */}
            <div className="form-section">
              <label className="form-label-custom">
                <i className="bi bi-check-circle-fill"></i>
                Is Lead Qualified <span className="required">*</span>
              </label>
              <div className="toggle-group">
                <div
                  className={`toggle-option ${leadQualified === "Yes" ? "active yes" : ""}`}
                  onClick={() => setLeadQualified("Yes")}
                >
                  <i className="bi bi-check-lg"></i>
                  Yes
                </div>
                <div
                  className={`toggle-option ${leadQualified === "No" ? "active no" : ""}`}
                  onClick={() => setLeadQualified("No")}
                >
                  <i className="bi bi-x-lg"></i>
                  No
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="form-row">
              {/* Contact Person */}
              <div className="form-section">
                <label className="form-label-custom">
                  <i className="bi bi-person-fill"></i>
                  Contact Person
                </label>
                <div className="input-wrapper">
                  <i className="bi bi-person input-icon"></i>
                  <input
                    type="text"
                    className="form-input-custom"
                    placeholder="Enter contact person name"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>
              </div>

              {/* RERA */}
              <div className="form-section">
                <label className="form-label-custom">
                  <i className="bi bi-card-checklist"></i>
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
            </div>

            {/* Remark */}
            <div className="form-section">
              <label className="form-label-custom">
                <i className="bi bi-chat-square-text-fill"></i>
                Remarks
              </label>
              <div className="textarea-wrapper">
                <textarea
                  className="form-textarea-custom"
                  placeholder="Add any remarks or notes..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
            </div>

            {/* Conditional Meeting Date */}
            {status === "Agreed to next meeting" && (
              <div className="form-section meeting-date-section">
                <label className="form-label-custom">
                  <i className="bi bi-calendar-event-fill"></i>
                  Date of Official Meeting <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <i className="bi bi-calendar3 input-icon"></i>
                  <input
                    type="date"
                    className="form-input-custom"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
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
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActionModal;
