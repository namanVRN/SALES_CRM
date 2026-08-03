import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAgreementData,
  submitAgreementAction,
} from "../services/fmsNewApi";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import { toast } from "react-toastify";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

function Agreement() {
  const queryClient = useQueryClient();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    dealsIn: [],
    contactInOffice: "",
    uploadPdf: null,
    remark: "",
    nextPlannedDate: "", // ✅ NEW
    notInterestedReason: "", // ✅ NEW
  });
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    searchTerm: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["agreement", fromDate, toDate, status],
    queryFn: () => fetchAgreementData({ fromDate, toDate, status }),
    select: (res) => res?.data || [],
  });

  const updateMutation = useMutation({
    mutationFn: submitAgreementAction,
    onSuccess: () => {
      toast.success("Agreement updated successfully");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["agreement"] });
      refetch();
    },
    onError: () => toast.error("Update failed. Try again."),
  });

  const handleAction = (row) => {
    setSelectedRow(row);
    setFormData({
      status: "",
      dealsIn: [],
      contactInOffice: "",
      uploadPdf: null,
      remark: "",
      nextPlannedDate: "", // ✅ NEW
      notInterestedReason: "", // ✅ NEW
    });
    setShowModal(true);
  };

  const parseDDMMYYYY = (str) => {
    if (!str) return null;
    const s = String(str).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const datePart = s.split("T")[0];
      const [y, m, d] = datePart.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      return isNaN(dt.getTime()) ? null : dt;
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
      const datePart = s.split(" ")[0];
      const [d, m, y] = datePart.split("/").map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setHours(0, 0, 0, 0);
      return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  };

  const filteredRows = rows.filter((row) => {
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      const firmMatch = (row.firmName?.toLowerCase() || "").includes(term);
      const contactMatch = (row.contact?.toString() || "").includes(term);
      if (!firmMatch && !contactMatch) return false;
    }
    if (filters.fromDate || filters.toDate) {
      const planned = parseDDMMYYYY(row.plannedDate);
      if (!planned) return false;
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        from.setHours(0, 0, 0, 0);
        if (planned < from) return false;
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate);
        to.setHours(23, 59, 59, 999);
        if (planned > to) return false;
      }
    }
    return true;
  });

  const isAnyFilterActive =
    filters.searchTerm || filters.fromDate || filters.toDate;

  const clearFilters = () =>
    setFilters({ fromDate: "", toDate: "", searchTerm: "" });

  const getMinDateTime = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}T${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  };

  const handleModalSubmit = async () => {
    if (!formData.status) {
      toast.warning("Status is required");
      return;
    }

    const isNextFollowup = formData.status === "Next Followup Required";
    const isNotInterested = formData.status === "Not Interested"; // ✅ NEW

    if (isNextFollowup && !formData.nextPlannedDate) {
      toast.warning("Next Planned Date is required");
      return;
    }

    // ✅ NEW: Not Interested validation
    if (isNotInterested && !formData.notInterestedReason.trim()) {
      toast.error("Reason for Not Interested देना ज़रूरी है!");
      return;
    }

    const payload = {
      rowNumber: selectedRow.rowNumber,
      status: formData.status,

      // Deals In — only for Done status
      dealsIn:
        isNextFollowup || isNotInterested
          ? ""
          : Array.isArray(formData.dealsIn)
            ? formData.dealsIn.join(", ")
            : formData.dealsIn || "",

      // Contact in office — only for Done status
      contactInOffice:
        isNextFollowup || isNotInterested ? "" : formData.contactInOffice || "",

      remark: formData.remark || "",

      // PDF — only for Done status
      uploadPdf: isNextFollowup || isNotInterested ? null : formData.uploadPdf,

      nextPlannedDate: isNextFollowup ? formData.nextPlannedDate : "",

      // ✅ NEW: Not Interested reason
      notInterestedReason: isNotInterested ? formData.notInterestedReason : "",

      // ✅ NEW: Pass lead context for NI sheet logging
      leadInfo: {
        uniqueId: selectedRow.uniqueId || "",
        firmName: selectedRow.firmName || "",
        contact: selectedRow.contact || "",
        locality: selectedRow.locality || "",
      },
    };

    console.log("Submitting payload:", payload);

    try {
      await updateMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Submit error:", error);
      console.error("Backend error:", error.response?.data);
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to submit. Please try again.",
      );
    }
  };

  // ✅ NEW: Smart date formatter — handles multiple formats safely
  const formatPlannedDate = (dateStr) => {
    if (!dateStr) return "-";
    const str = String(dateStr).trim();

    // Case 1: ISO format "YYYY-MM-DD" (e.g., 2026-06-24)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [y, m, d] = str.split("-");
      return `${d}/${m}/${y}`;
    }

    // Case 2: ISO with time "YYYY-MM-DDTHH:mm:ss" or similar
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
      const [datePart, timePart] = str.split("T");
      const [y, m, d] = datePart.split("-");
      const time = timePart ? timePart.substring(0, 5) : "";
      return time ? `${d}/${m}/${y}, ${time}` : `${d}/${m}/${y}`;
    }

    // Case 3: DD/MM/YYYY or DD/MM/YYYY HH:MM:SS (already correct format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
      const [datePart, timePart] = str.split(" ");
      const [d, m, y] = datePart.split("/");
      const time = timePart ? timePart.substring(0, 5) : "";
      return time
        ? `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}, ${time}`
        : `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }

    // Fallback: return as-is
    return str;
  };

  // ✅ Robust overdue check — handles multiple date formats safely
  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    const str = String(dateStr).trim();
    let pd;

    try {
      // Case 1: ISO YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, m, d] = str.split("-").map(Number);
        pd = new Date(y, m - 1, d);
      }
      // Case 2: ISO with time YYYY-MM-DDTHH:mm
      else if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
        const [datePart] = str.split("T");
        const [y, m, d] = datePart.split("-").map(Number);
        pd = new Date(y, m - 1, d);
      }
      // Case 3: DD/MM/YYYY [HH:MM:SS]
      else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        const datePart = str.split(" ")[0];
        const [d, m, y] = datePart.split("/").map(Number);
        pd = new Date(y, m - 1, d);
      } else {
        return false;
      }

      if (isNaN(pd.getTime())) return false;
      pd.setHours(0, 0, 0, 0);
    } catch {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pd <= today;
  };

  const dealsOptions = [
    { value: "JV", label: "JV", icon: "bi-diagram-3" },
    { value: "UNIT SALE", label: "Unit Sale", icon: "bi-house-door" },
    {
      value: "LAND SELLING AND PURCHASE",
      label: "Land Selling & Purchase",
      icon: "bi-map",
    },
    { value: "RENT", label: "Rent", icon: "bi-key" },
  ];

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Outgoing", path: "/channel-partner/cp-outgoing" },
        { name: "Meetings", path: "/process/meetings/overview" },
        { name: "Agreement", path: "/meetings/agreement" },
      ]}
    >
      <div className="table-page-container">
        {/* Background Elements */}
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
          ></div>
        </div>

        {/* Header Section */}
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-file-earmark-check-fill"></i>
            </div>
            <div className="header-text">
              <h1>Agreement</h1>
              <p>Manage signed agreements, contracts & terms</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{rows.length}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>

        {/* ✅ NEW — Filters */}
        <div className="filter-section">
          <div className="filter-header">
            <div className="filter-title">
              <i className="bi bi-funnel"></i>
              <span>Filters</span>
              {isAnyFilterActive && (
                <span
                  style={{
                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                    color: "#fff",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    marginLeft: "8px",
                  }}
                >
                  Active
                </span>
              )}
            </div>
            <div className="filter-controls">
              <button
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                }}
              >
                <i
                  className={`bi bi-chevron-${showFilters ? "up" : "down"}`}
                ></i>
                {showFilters ? "Hide" : "Show"} Filters
              </button>
              {isAnyFilterActive && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  <i className="bi bi-x-circle"></i>Clear
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="filter-form">
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-search"></i> Search (Firm or Contact)
                </label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, searchTerm: e.target.value }))
                  }
                  placeholder="Search by firm name or contact..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "14px",
                    color: "#000",
                  }}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-calendar-range"></i> Planned Date Range
                </label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, fromDate: e.target.value }))
                    }
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "14px",
                      color: "#000",
                    }}
                  />
                  <span style={{ color: "#6b7280", fontWeight: "600" }}>
                    to
                  </span>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, toDate: e.target.value }))
                    }
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "14px",
                      color: "#000",
                    }}
                  />
                </div>
              </div>

              {isAnyFilterActive && (
                <div className="filter-stats">
                  <span className="filter-stat-item">
                    <i className="bi bi-filter-circle"></i>Active:
                  </span>
                  <span className="filter-tag results">
                    Results: {filteredRows.length} of {rows.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="table-section">
          {isLoading ? (
            <div className="table-loading">
              <SkeletonTable rowsCount={8} />
            </div>
          ) : rows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-file-earmark-x"></i>
              </div>
              <h3>No Agreements Found</h3>
              <p>No pending agreement records at the moment</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-hash"></i>
                          Unique ID
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar-event"></i>
                          Planned Date
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-building"></i>
                          Firm Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-telephone"></i>
                          Contact
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-geo-alt"></i>
                          Locality
                        </div>
                      </th>
                      <th className="th-action">
                        <div className="th-content">
                          <i className="bi bi-gear"></i>
                          Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const overdue = isOverdue(r.plannedDate);
                      return (
                        <tr
                          key={r.rowNumber}
                          className={overdue ? "agreement-overdue-row" : ""}
                          style={{ animationDelay: `${i * 0.03}s` }}
                        >
                          <td>
                            <div className="id-cell">
                              <span
                                className="id-badge"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                                  color: "#92400e",
                                }}
                              >
                                {r.uniqueId}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="date-cell">
                              <span
                                className={`date-badge ${overdue ? "overdue-badge" : ""}`}
                                style={{
                                  background: overdue
                                    ? "linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)"
                                    : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                                  color: overdue ? "#991b1b" : "#92400e",
                                  padding: "6px 12px",
                                  borderRadius: "8px",
                                  fontSize: "0.85rem",
                                  fontWeight: "600",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  whiteSpace: "nowrap",
                                  border: overdue
                                    ? "1px solid #ef4444"
                                    : "none",
                                }}
                              >
                                <i
                                  className={
                                    overdue
                                      ? "bi bi-exclamation-triangle-fill"
                                      : "bi bi-calendar3"
                                  }
                                ></i>
                                {formatPlannedDate(r.plannedDate)}
                                {overdue && (
                                  <span
                                    style={{
                                      background: "#dc2626",
                                      color: "#fff",
                                      fontSize: "9px",
                                      fontWeight: "700",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      marginLeft: "4px",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    OVERDUE
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="firm-cell">
                              <span className="firm-name">{r.firmName}</span>
                            </div>
                          </td>

                          <td>
                            <div className="contact-cell">
                              <a
                                href={`tel:${r.contact}`}
                                className="contact-link"
                              >
                                <i className="bi bi-telephone-fill"></i>
                                {r.contact || "-"}
                              </a>
                            </div>
                          </td>

                          <td>
                            <div className="locality-cell">
                              <i className="bi bi-pin-map"></i>
                              {r.locality || "-"}
                            </div>
                          </td>

                          <td className="action-cell">
                            <button
                              className="action-btn"
                              onClick={() => handleAction(r)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              }}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="table-footer">
                <div className="footer-info">
                  <i
                    className="bi bi-info-circle"
                    style={{ color: "#f59e0b" }}
                  ></i>
                  Showing <strong>{rows.length}</strong> record
                  {rows.length !== 1 ? "s" : ""}
                </div>
                <button className="refresh-btn" onClick={() => refetch()}>
                  <i className="bi bi-arrow-clockwise"></i>
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="modal-container modal-large"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="modal-header-custom"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-file-earmark-check-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Agreement Action</h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge">
                        <i className="bi bi-building"></i>
                        {selectedRow?.firmName || "Unknown Firm"}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-telephone-fill"></i>
                        {selectedRow?.contact || "Unknown Contact"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body-custom">
                <form>
                  {/* Status */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-check-circle-fill"
                        style={{ color: "#f59e0b" }}
                      ></i>
                      Status <span className="required">*</span>
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                      }}
                    >
                      {/* Done */}
                      <div
                        onClick={() =>
                          setFormData({
                            ...formData,
                            status: "Done",
                            nextPlannedDate: "",
                          })
                        }
                        style={{
                          padding: "15px",
                          border: `2px solid ${formData.status === "Done" ? "#10b981" : "#e2e8f0"}`,
                          borderRadius: "10px",
                          background:
                            formData.status === "Done"
                              ? "rgba(16,185,129,0.05)"
                              : "#fff",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <i
                          className="bi bi-check-circle-fill"
                          style={{
                            color: "#10b981",
                            fontSize: "1.5rem",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        ></i>
                        <span style={{ fontWeight: "600", color: "#374151" }}>
                          Done
                        </span>
                      </div>

                      {/* ✅ Next Followup Required */}
                      <div
                        onClick={() =>
                          setFormData({
                            ...formData,
                            status: "Next Followup Required",
                            dealsIn: [],
                            uploadPdf: null,
                          })
                        }
                        style={{
                          padding: "15px",
                          border: `2px solid ${formData.status === "Next Followup Required" ? "#f59e0b" : "#e2e8f0"}`,
                          borderRadius: "10px",
                          background:
                            formData.status === "Next Followup Required"
                              ? "rgba(245,158,11,0.08)"
                              : "#fff",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <i
                          className="bi bi-arrow-repeat"
                          style={{
                            color: "#f59e0b",
                            fontSize: "1.5rem",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        ></i>
                        <span
                          style={{
                            fontWeight: "600",
                            color:
                              formData.status === "Next Followup Required"
                                ? "#f59e0b"
                                : "#374151",
                          }}
                        >
                          Next Followup Required
                        </span>
                      </div>

                      <div
                        onClick={() =>
                          setFormData({
                            ...formData,
                            status: "Not Interested",
                            dealsIn: [],
                            uploadPdf: null,
                            nextPlannedDate: "",
                          })
                        }
                        style={{
                          padding: "15px",
                          border: `2px solid ${formData.status === "Not Interested" ? "#dc2626" : "#e2e8f0"}`,
                          borderRadius: "10px",
                          background:
                            formData.status === "Not Interested"
                              ? "rgba(220,38,38,0.08)"
                              : "#fff",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        <i
                          className="bi bi-x-octagon-fill"
                          style={{
                            color: "#dc2626",
                            fontSize: "1.5rem",
                            display: "block",
                            marginBottom: "8px",
                          }}
                        ></i>
                        <span
                          style={{
                            fontWeight: "600",
                            color:
                              formData.status === "Not Interested"
                                ? "#dc2626"
                                : "#374151",
                          }}
                        >
                          Not Interested
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Next Planned Date — show only when Next Followup selected */}
                  {formData.status === "Next Followup Required" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        Next Planned Date <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={formData.nextPlannedDate}
                          min={getMinDateTime()}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nextPlannedDate: e.target.value,
                            })
                          }
                          style={{
                            color: "#000",
                            border: "1px solid #000",
                            padding: "10px",
                            borderRadius: "8px",
                            width: "100%",
                          }}
                        />
                      </div>
                      {formData.nextPlannedDate && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#f59e0b",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>Selected:{" "}
                          {new Date(formData.nextPlannedDate).toLocaleString(
                            "en-IN",
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ✅ NEW: Not Interested Reason Block */}
                  {formData.status === "Not Interested" && (
                    <div
                      className="form-section"
                      style={{
                        animation: "fadeIn 0.3s",
                        background: "rgba(220, 38, 38, 0.05)",
                        borderColor: "rgba(220, 38, 38, 0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-exclamation-triangle-fill"
                          style={{ color: "#dc2626" }}
                        ></i>
                        Reason for Not Interested{" "}
                        <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <textarea
                          className="form-input-custom"
                          rows="3"
                          placeholder="Why is the agreement not happening?"
                          value={formData.notInterestedReason}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              notInterestedReason: e.target.value,
                            })
                          }
                          style={{
                            color: "#000",
                            backgroundColor: "#fff",
                            resize: "vertical",
                            borderLeft: "3px solid #dc2626",
                            padding: "10px",
                            borderRadius: "8px",
                            width: "100%",
                            border: "1px solid #fca5a5",
                          }}
                        ></textarea>
                      </div>
                    </div>
                  )}

                  {/* Deals In - sirf Done status pe dikhao */}
                  {formData.status === "Done" && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-tags-fill"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        Deals In
                      </label>
                      <div className="deals-grid">
                        {dealsOptions.map((option) => {
                          const isSelected =
                            Array.isArray(formData.dealsIn) &&
                            formData.dealsIn.includes(option.value);
                          return (
                            <div
                              key={option.value}
                              className={`deals-option ${isSelected ? "active" : ""}`}
                              onClick={() => {
                                const current = Array.isArray(formData.dealsIn)
                                  ? formData.dealsIn
                                  : [];
                                const updated = isSelected
                                  ? current.filter((v) => v !== option.value)
                                  : [...current, option.value];
                                setFormData({ ...formData, dealsIn: updated });
                              }}
                            >
                              <i className={`bi ${option.icon}`}></i>
                              <span>{option.label}</span>
                              {isSelected && (
                                <i
                                  className="bi bi-check-circle-fill"
                                  style={{
                                    marginLeft: "auto",
                                    color: "#f59e0b",
                                    fontSize: "0.85rem",
                                  }}
                                ></i>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contact in Office - sirf Done pe */}
                  {formData.status === "Done" && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        Contact with in Office
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter contact person name"
                          value={formData.contactInOffice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contactInOffice: e.target.value,
                            })
                          }
                          style={{ color: "#000", border: "1px solid #000" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload PDF - sirf Done pe */}
                  {formData.status === "Done" && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-file-earmark-pdf-fill"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        Upload PDF
                      </label>
                      <div className="file-upload-wrapper">
                        <input
                          type="file"
                          id="pdfUpload"
                          accept=".pdf"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              uploadPdf: e.target.files[0] || null,
                            })
                          }
                          className="file-input-hidden"
                        />
                        <label
                          htmlFor="pdfUpload"
                          className="file-upload-label"
                        >
                          <i className="bi bi-cloud-arrow-up"></i>
                          <span>
                            {formData.uploadPdf?.name || "Choose PDF file..."}
                          </span>
                        </label>
                        <p className="file-hint">
                          Upload PDF file (will store link in sheet)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ✅ NEW: Previous Remarks (Read-Only) */}
                  {selectedRow?.remark && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-left-text"
                          style={{ color: "#8b5cf6" }}
                        ></i>
                        Previous Remarks
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#9ca3af",
                            marginLeft: "8px",
                            fontWeight: "normal",
                            background: "#f3f4f6",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          Read-Only
                        </span>
                      </label>
                      <div
                        style={{
                          padding: "12px 14px",
                          backgroundColor: "#faf5ff",
                          border: "1px solid #e9d5ff",
                          borderRadius: "8px",
                          borderLeft: "3px solid #8b5cf6",
                          color: "#5b21b6",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          minHeight: "50px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedRow.remark}
                      </div>
                    </div>
                  )}

                  {/* Existing Remark section — rename label to "New Remark" */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-square-text-fill"
                        style={{ color: "#f59e0b" }}
                      ></i>
                      New Remark
                    </label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea-custom"
                        placeholder="Add any remarks or notes..."
                        value={formData.remark}
                        onChange={(e) =>
                          setFormData({ ...formData, remark: e.target.value })
                        }
                        rows={3}
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer-custom">
                <button
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  <i className="bi bi-x-circle"></i>
                  Close
                </button>
                <button
                  className="btn-submit"
                  onClick={handleModalSubmit}
                  disabled={
                    updateMutation.isPending ||
                    !formData.status ||
                    (formData.status === "Next Followup Required" &&
                      !formData.nextPlannedDate)
                  }
                  style={{
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>
                      Saving...
                    </>
                  ) : formData.status === "Next Followup Required" ? (
                    <>
                      <i className="bi bi-arrow-repeat"></i>
                      Schedule Next Followup
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ✅ NEW: Overdue blink animation styles */}
      <style>{`
        @keyframes agreementOverdueBlink {
          0%, 100% {
            background-color: rgba(239, 68, 68, 0.05);
            box-shadow: inset 4px 0 0 #dc2626;
          }
          50% {
            background-color: rgba(239, 68, 68, 0.15);
            box-shadow: inset 4px 0 0 #dc2626, 0 0 12px rgba(239, 68, 68, 0.3);
          }
        }

        @keyframes agreementBadgePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
          }
        }

        .agreement-overdue-row {
          animation: agreementOverdueBlink 1.8s ease-in-out infinite;
          position: relative;
        }

        .agreement-overdue-row td {
          border-top: 1px solid rgba(239, 68, 68, 0.2);
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
        }

        .agreement-overdue-row td:first-child {
          border-left: 4px solid #dc2626;
        }

        .agreement-overdue-row .overdue-badge {
          animation: agreementBadgePulse 1.5s ease-in-out infinite;
        }

        .agreement-overdue-row:hover {
          animation-play-state: paused;
          background-color: rgba(239, 68, 68, 0.2) !important;
        }
      `}</style>
    </Layout>
  );
}

export default Agreement;
