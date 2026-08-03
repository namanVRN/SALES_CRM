import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "../assets/styles/WhatsAppModal.css";

// ─── PROJECT DATA ─────────────────────────────────────────────
const WA_PROJECT_DATA = {
  "Ultimate Heights": {
    location: "https://maps.app.goo.gl/zsHAMix5PWSF93Ht9",
    layout: "",
    brochure:
      "https://drive.google.com/file/d/1iGPxZYujFQf6yvwuamfW5dK_D2HeuLCa/view?usp=drive_link",
    video:
      "https://drive.google.com/file/d/1U6B3ys56jZk_WDetdCIYM77ICdwAQvYj/view?usp=sharing",
    type: "premium residential",
  },

  "My City": {
    location: "https://maps.app.goo.gl/HEFQVs1wMCKGoWyw9",
    layout:
      "https://drive.google.com/file/d/1J9oEdfF9mAHfXEVkgTE4K6J1jX8OjcD1/view?usp=sharing",
    brochure: "",
    video: "",
    type: "township",
  },

  "Signature S 9": {
    location: "https://maps.app.goo.gl/RNpVzLTozGpXXAS26",
    layout: "",
    brochure: "",
    video: "",
    type: "premium residential",
  },

  "Ultimate English Villas": {
    location: "https://maps.app.goo.gl/e6pHRaeyZMjnpDxCA",
    layout:
      "https://drive.google.com/file/d/1Mlz6vSJ9HB5t1UfHfI8J0Hkx4Rh347vt/view?usp=drive_link",
    brochure: "",
    video: "",
    type: "luxury villa",
  },

  "SIGNATURE HERITAGE": {
    location: "https://maps.app.goo.gl/kDYTUbJdHwFkfexX7",
    layout:
      "https://drive.google.com/file/d/1l66zgL-H9v_CzbydzY5F8HhmyeI8P4yA/view?usp=drive_link",
    brochure: "",
    video: "",
    type: "heritage residential",
  },

  "Ultimate Sky Villa": {
    location: "https://maps.app.goo.gl/cTai6deEFGk8kcsG8",
    layout: "",
    brochure: "",
    video: "",
    type: "sky villa",
  },

  "Signature Paradise": {
    location: "https://maps.app.goo.gl/3H663mgEgtbBviX1A",
    layout:
      "https://drive.google.com/file/d/1CiopXjO_69hD7kw7wOXhhZd6YrV1pC65/view?usp=sharing",
    brochure: "",
    video: "",
    type: "premium plotted residential",
  },

  "Signature One": {
    location: "https://maps.app.goo.gl/Lmu2vNN6Mxwp5zYG9",
    layout: "",
    brochure: "",
    video: "",
    type: "premium Commercial",
  },
};

// ─── HELPERS ──────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name) return "#10b981";
  const colors = [
    "#10b981",
    "#6366f1",
    "#ec4899",
    "#f59e0b",
    "#8b5cf6",
    "#0891b2",
    "#f43f5e",
    "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ─── BUILD MESSAGE TEMPLATE ───────────────────────────────────
const buildWaTemplate = (projectName, bdmName) => {
  const proj = WA_PROJECT_DATA[projectName];
  if (!proj) return "";

  let msg = "";
  msg += "Signature Group — Vipin Chouhan Associates\n";
  msg += "A Trusted Real Estate Name with Over 37+ Years of Excellence\n\n";
  msg += "Ar. Vipin Chouhan\n\n";
  msg += "Greetings from Signature Group.\n\n";
  msg += `We are pleased to share details of our upcoming ${proj.type} project,\n`;
  msg += `*${projectName}*\n\n`;
  msg += `📍 Project Location: ${proj.location}\n\n`;
  msg += "✅ Key Project Highlights:\n";
  msg += "• T&CP Approved Layout\n";
  msg += "• Well-planned internal roads and open spaces\n";
  msg += "• Ideal for residential development and long-term investment\n\n";

  if (proj.layout || proj.brochure || proj.video) {
    msg += "📎 Project Resources:\n";
    if (proj.layout) msg += `📐 Layout: ${proj.layout}\n`;
    if (proj.brochure) msg += `📄 Brochure: ${proj.brochure}\n`;
    if (proj.video) msg += `🎥 Video: ${proj.video}\n`;
    msg += "\n";
  }

  msg += "📞 For further details or to schedule a site visit:\n";
  msg += "9201837706\n\n";
  msg += "🕘 Office Hours: 9:00 AM – 6:00 PM\n\n";
  msg += "Warm regards,\n";
  msg += `${bdmName}\n`;
  msg += "Business Development Manager";

  return msg;
};

// ─── MAIN COMPONENT ───────────────────────────────────────────
function WhatsAppModal({ isOpen, onClose, lead }) {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const bdmName = user?.name || user?.username || "Vijaya Rajput";

  // ─── RESET STATE WHEN MODAL OPENS + AUTO-MATCH PROJECT ───
  useEffect(() => {
    if (!isOpen) return;

    setSelectedProject("");
    setPreviewMessage("");
    setCustomMessage("");

    // Auto-match project from lead.projectSelection
    if (lead?.projectSelection) {
      const lp = lead.projectSelection.toLowerCase().trim();
      const matched = Object.keys(WA_PROJECT_DATA).find((name) => {
        const n = name.toLowerCase();
        return n === lp || n.includes(lp) || lp.includes(n);
      });
      if (matched) {
        setSelectedProject(matched);
        setPreviewMessage(buildWaTemplate(matched, bdmName));
      }
    }
  }, [isOpen, lead, bdmName]);

  // ─── HANDLE PROJECT CHANGE ─────────────────────────────────
  const handleProjectChange = (e) => {
    const project = e.target.value;
    setSelectedProject(project);
    if (project) {
      setPreviewMessage(buildWaTemplate(project, bdmName));
    } else {
      setPreviewMessage("");
    }
  };

  // ─── SEND MESSAGE ──────────────────────────────────────────
  const handleSend = () => {
    if (!lead?.customerContact) {
      toast.error("Customer contact missing");
      return;
    }

    // Use preview (template) if project selected, else custom message
    const msg = selectedProject
      ? previewMessage.trim()
      : customMessage.trim();

    if (!msg) {
      toast.error("Please select a project or type a custom message");
      return;
    }

    // Build WhatsApp URL
    let cleanPhone = String(lead.customerContact).replace(/[\s\-\+\(\)]/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    toast.success(`WhatsApp opened for ${lead.customerName || ""}`);
    onClose();
  };

  if (!isOpen || !lead) return null;

  const proj = selectedProject ? WA_PROJECT_DATA[selectedProject] : null;
  const avatarColor = getAvatarColor(lead.customerName);
  const canSend = selectedProject ? !!previewMessage.trim() : !!customMessage.trim();

  return (
    <div className="wa-modal-overlay" onClick={onClose}>
      <div className="wa-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="wa-modal-header">
          <div className="wa-header-left">
            <div className="wa-header-icon">
              <i className="bi bi-whatsapp"></i>
            </div>
            <div className="wa-header-text">
              <h2>Send WhatsApp</h2>
              <p>Select project → Preview → Send</p>
            </div>
          </div>
          <button className="wa-close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="wa-modal-body">
          {/* LEAD CARD */}
          <div className="wa-lead-card">
            <div
              className="wa-lead-avatar"
              style={{ background: avatarColor }}
            >
              {getInitials(lead.customerName)}
            </div>
            <div className="wa-lead-info">
              <div className="wa-lead-name">{lead.customerName || "-"}</div>
              <div className="wa-lead-phone">
                <i className="bi bi-telephone-fill"></i>
                +91 {lead.customerContact || "-"}
              </div>
            </div>
          </div>

          {/* PROJECT DROPDOWN */}
          <div className="wa-section">
            <label className="wa-section-label">
              <span className="wa-step-num">1</span>
              SELECT PROJECT
            </label>
            <div className="wa-select-wrapper">
              <i className="bi bi-building wa-select-icon"></i>
              <select
                className="wa-select"
                value={selectedProject}
                onChange={handleProjectChange}
              >
                <option value="">— Choose a project —</option>
                {Object.keys(WA_PROJECT_DATA).map((name) => (
                  <option key={name} value={name}>
                    {name} ({WA_PROJECT_DATA[name].type})
                  </option>
                ))}
              </select>
              <i className="bi bi-chevron-down wa-select-chevron"></i>
            </div>

            {/* PROJECT BADGE + ASSET CHIPS */}
            {proj && (
              <>
                <div className="wa-project-badge">
                  <span className="wa-badge-dot"></span>
                  <span className="wa-badge-name">{selectedProject}</span>
                  <span className="wa-badge-type">{proj.type}</span>
                </div>

                <div className="wa-asset-chips">
                  {proj.location && (
                    <a
                      href={proj.location}
                      target="_blank"
                      rel="noreferrer"
                      className="wa-chip wa-chip-loc"
                    >
                      📍 Location
                    </a>
                  )}
                  {proj.layout && (
                    <a
                      href={proj.layout}
                      target="_blank"
                      rel="noreferrer"
                      className="wa-chip wa-chip-lay"
                    >
                      📐 Layout
                    </a>
                  )}
                  {proj.brochure && (
                    <a
                      href={proj.brochure}
                      target="_blank"
                      rel="noreferrer"
                      className="wa-chip wa-chip-bro"
                    >
                      📄 Brochure
                    </a>
                  )}
                  {proj.video && (
                    <a
                      href={proj.video}
                      target="_blank"
                      rel="noreferrer"
                      className="wa-chip wa-chip-vid"
                    >
                      🎥 Video
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* PREVIEW (shown only when project selected) */}
          {selectedProject && (
            <div className="wa-section">
              <label className="wa-section-label">
                <span className="wa-step-num">2</span>
                MESSAGE PREVIEW
                <span className="wa-editable-tag">
                  <i className="bi bi-pencil"></i> Editable
                </span>
              </label>
              <textarea
                className="wa-preview-textarea"
                value={previewMessage}
                onChange={(e) => setPreviewMessage(e.target.value)}
                rows={8}
              />
            </div>
          )}

          {/* CUSTOM MESSAGE (shown only when no project selected) */}
          {!selectedProject && (
            <div className="wa-section">
              <label className="wa-section-label wa-custom-label">
                <i className="bi bi-chat-square-text"></i>
                OR WRITE A CUSTOM MESSAGE
              </label>
              <textarea
                className="wa-custom-textarea"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="wa-modal-footer">
          <button className="wa-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="wa-btn-send"
            onClick={handleSend}
            disabled={!canSend}
          >
            <i className="bi bi-whatsapp"></i>
            Send on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppModal;