import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMeetingsSub,
  submitMeetingsSubAction,
} from "../services/fmsNewApi";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import { toast } from "react-toastify";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

function Meetings() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    channelPartnerName: "",
    reviseDate: "",
    reviseCount: "",
    remark: "",
    notInterestedReason: "",
  });
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    minRevise: "",
    maxRevise: "",
    searchTerm: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["meetingsSub", status],
    queryFn: () => fetchMeetingsSub({ status }),
    select: (res) => res?.data || [],
  });

  const updateMutation = useMutation({
    mutationFn: submitMeetingsSubAction,
    onSuccess: () => {
      toast.success("Meeting updated successfully");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["meetingsSub"] });
      refetch();
    },
    onError: () => toast.error("Update failed. Try again."),
  });

  const handleAction = (row) => {
    setSelectedRow(row);
    setFormData({
      status: "",
      channelPartnerName: "",
      reviseDate: "",
      reviseCount: row.reviseCount || "1",
      remark: "",
      notInterestedReason: "", // ✅ NEW
    });
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (!formData.status) {
      toast.warning("Please select a status");
      return;
    }

    if (
      formData.status === "Not Interested" &&
      !formData.notInterestedReason.trim()
    ) {
      toast.error("Reason for Not Interested देना ज़रूरी है!");
      return;
    }

    const payload = {
      rowNumber: selectedRow.rowNumber,
      status: formData.status,
      channelPartnerName: formData.channelPartnerName,
      reviseDate: formData.reviseDate,
      reviseCount: formData.reviseCount,
      remark: formData.remark,
      notInterestedReason: formData.notInterestedReason || "", // ✅ NEW
    };

    updateMutation.mutate(payload);
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
    // Search by firm name or contact
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      const firmMatch = (row.firmName?.toLowerCase() || "").includes(term);
      const contactMatch = (row.contact?.toString() || "").includes(term);
      if (!firmMatch && !contactMatch) return false;
    }

    // Date range
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

    // Revise count range
    const count = parseInt(row.reviseCount) || 0;
    if (filters.minRevise !== "" && count < parseInt(filters.minRevise))
      return false;
    if (filters.maxRevise !== "" && count > parseInt(filters.maxRevise))
      return false;

    return true;
  });

  const isAnyFilterActive =
    filters.searchTerm ||
    filters.fromDate ||
    filters.toDate ||
    filters.minRevise !== "" ||
    filters.maxRevise !== "";

  const clearFilters = () =>
    setFilters({
      fromDate: "",
      toDate: "",
      minRevise: "",
      maxRevise: "",
      searchTerm: "",
    });

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

  const statusOptions = [
    { value: "Done", label: "Done", icon: "bi-check-circle", color: "#10b981" },
    {
      value: "Revise",
      label: "Revise",
      icon: "bi-arrow-repeat",
      color: "#6366f1",
    },
    {
      value: "Not Done",
      label: "Not Done",
      icon: "bi-x-circle",
      color: "#ef4444",
    },
    {
      value: "Not Interested",
      label: "Not Interested",
      icon: "bi-x-octagon-fill",
      color: "#dc2626",
    },
  ];

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Outgoing", path: "/channel-partner/cp-outgoing" },
        { name: "Meetings Overview", path: "/process/meetings/overview" },
        { name: "Meetings", path: "/process/meetings/meetings" },
      ]}
    >
      <div className="table-page-container">
        {/* Background Elements */}
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
          ></div>
        </div>

        {/* Header Section */}
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="header-text">
              <h1>Meetings</h1>
              <p>Track scheduled and completed meetings with partners</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{filteredRows.length}</span>
              <span className="stat-label">
                {isAnyFilterActive ? "Filtered" : "Pending"}
              </span>
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
                    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
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
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
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
              {/* Search */}
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
                    outline: "none",
                    color: "#000",
                  }}
                />
              </div>

              {/* Date Range */}
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

              {/* Revise Count Range */}
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-arrow-repeat"></i> Revise Count
                </label>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filters.minRevise}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, minRevise: e.target.value }))
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
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={filters.maxRevise}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, maxRevise: e.target.value }))
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
          ) : filteredRows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-calendar-x"></i>
              </div>
              <h3>No Meetings Found</h3>
              <p>
                {isAnyFilterActive ? "No matches found" : "No pending meetings"}
              </p>
              {isAnyFilterActive && (
                <button className="empty-clear-btn" onClick={clearFilters}>
                  <i className="bi bi-funnel"></i>Clear Filters
                </button>
              )}
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
                      <th>
                        <div className="th-content">
                          <i className="bi bi-arrow-repeat"></i>
                          Revise Count
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
                    {filteredRows.map((r, i) => {
                      const overdue = isOverdue(r.plannedDate);
                      return (
                        <tr
                          key={r.rowNumber}
                          className={overdue ? "meeting-overdue-row" : ""}
                          style={{ animationDelay: `${i * 0.03}s` }}
                        >
                          <td>
                            <div className="id-cell">
                              <span
                                className="id-badge"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                                  color: "#5b21b6",
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
                                    : "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                                  color: overdue ? "#991b1b" : "#3730a3",
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
                          <td>
                            <span className="revise-badge">
                              <i className="bi bi-arrow-repeat"></i>
                              {r.reviseCount || "1"}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button
                              className="action-btn"
                              onClick={() => handleAction(r)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
                  Showing <strong>{filteredRows.length}</strong> of{" "}
                  <strong>{rows.length}</strong> records
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
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Meeting Action</h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge">
                        <i className="bi bi-building"></i>
                        {selectedRow?.firmName || "Unknown Firm"}
                      </span>
                      <span className="firm-badge">
                        <i className="bi bi-building"></i>
                        {selectedRow?.contact || "Unknown Firm"}
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
                  {/* Status Selection */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-tag-fill"
                        style={{ color: "#6366f1" }}
                      ></i>
                      Status <span className="required">*</span>
                    </label>
                    <div
                      className="status-grid"
                      style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                    >
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`status-option ${formData.status === option.value ? "active" : ""}`}
                          onClick={() =>
                            setFormData({ ...formData, status: option.value })
                          }
                          style={{ "--option-color": option.color }}
                        >
                          <i className={`bi ${option.icon}`}></i>
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Channel Partner Name */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-person-badge-fill"
                        style={{ color: "#6366f1" }}
                      ></i>
                      Name of Channel Partner
                    </label>

                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="form-input-custom"
                        style={{
                          color: "black",
                          border: "1px solid black",
                        }}
                        placeholder="Enter channel partner name"
                        value={formData.channelPartnerName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            channelPartnerName: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Revise Date - Shows when Revise is selected */}
                  {formData.status === "Revise" && (
                    <div
                      className="form-section meeting-date-section"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)",
                        borderColor: "rgba(99, 102, 241, 0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-event-fill"
                          style={{ color: "#6366f1" }}
                        ></i>
                        Revise Date <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="date"
                          className="form-input-custom"
                          style={{ color: "#000" }}
                          value={formData.reviseDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              reviseDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* ✅ NEW: Not Interested — Reason Required */}
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
                          placeholder="Why is the partner not interested?"
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
                          }}
                        ></textarea>
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
                        style={{ color: "#6366f1" }}
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

                  {/* Remark */}
                  {/* <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-square-text-fill"
                        style={{ color: "#6366f1" }}
                      ></i>
                      Remark
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
                  </div> */}
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
                    (formData.status === "Not Interested" &&
                      !formData.notInterestedReason.trim())
                  }
                  style={{
                    background:
                      formData.status === "Not Interested"
                        ? "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
                        : formData.status === "Not Done"
                          ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                          : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>
                      Saving...
                    </>
                  ) : formData.status === "Not Interested" ? (
                    <>
                      <i className="bi bi-x-octagon-fill"></i>
                      Mark Not Interested
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
        @keyframes overdueBlink {
          0%, 100% {
            background-color: rgba(239, 68, 68, 0.05);
            box-shadow: inset 4px 0 0 #dc2626;
          }
          50% {
            background-color: rgba(239, 68, 68, 0.15);
            box-shadow: inset 4px 0 0 #dc2626, 0 0 12px rgba(239, 68, 68, 0.3);
          }
        }

        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
          }
        }

        .meeting-overdue-row {
          animation: overdueBlink 1.8s ease-in-out infinite;
          position: relative;
        }

        .meeting-overdue-row td {
          border-top: 1px solid rgba(239, 68, 68, 0.2);
          border-bottom: 1px solid rgba(239, 68, 68, 0.2);
        }

        .meeting-overdue-row td:first-child {
          border-left: 4px solid #dc2626;
        }

        .overdue-badge {
          animation: badgePulse 1.5s ease-in-out infinite;
        }

        .meeting-overdue-row:hover {
          animation-play-state: paused;
          background-color: rgba(239, 68, 68, 0.2) !important;
        }
      `}</style>
    </Layout>
  );
}

export default Meetings;
