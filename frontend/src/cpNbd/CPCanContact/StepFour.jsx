import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCPCanContactMeeting,
  updateCPCanContactMeeting,
} from "../../services/cpApi";
import Layout from "../../components/Layout";
import SkeletonTable from "../../components/SkeletonTable";
import "../../assets/styles/TablePages.css";
import "../../assets/styles/ActionModal.css";
import { toast } from "react-toastify";

function CPMeetingCanContact() {
  const queryClient = useQueryClient();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    rescheduleDate: "",
    remarks: "",
  });

  // Filter State
  const [filters, setFilters] = useState({
    plannedDateFrom: "",
    plannedDateTo: "",
    customerName: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch Data – now using CP API
  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cp-meeting-can-contact"],
    queryFn: fetchCPCanContactMeeting,
    select: (res) => res?.data || res || [],
    staleTime: 1000 * 60 * 5,
  });

  // Urgent / Overdue logic (unchanged)
  const isPlannedDateUrgent = (plannedDateStr) => {
    if (!plannedDateStr) return false;
    const parts = plannedDateStr.split("/");
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    const plannedDate = new Date(year, month - 1, day);
    plannedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return plannedDate <= today;
  };

  // Filtered Data (unchanged)
  const filteredRows = rows.filter((row) => {
    if (filters.customerName) {
      const customerName = row.customerName?.toLowerCase() || "";
      const searchTerm = filters.customerName.toLowerCase().trim();
      if (!customerName.includes(searchTerm)) return false;
    }

    if (!filters.plannedDateFrom && !filters.plannedDateTo) return true;

    const plannedDate = row.plannedDate;
    if (!plannedDate) return false;

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split("/");
      if (parts.length !== 3) return null;
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day);
    };

    const rowDate = parseDate(plannedDate);
    if (!rowDate) return false;

    const fromDate = filters.plannedDateFrom
      ? new Date(filters.plannedDateFrom)
      : null;
    const toDate = filters.plannedDateTo
      ? new Date(filters.plannedDateTo)
      : null;

    const normalizeDate = (date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizedRowDate = normalizeDate(rowDate);
    const normalizedFromDate = fromDate ? normalizeDate(fromDate) : null;
    const normalizedToDate = toDate ? normalizeDate(toDate) : null;

    if (normalizedFromDate && normalizedRowDate < normalizedFromDate)
      return false;
    if (normalizedToDate && normalizedRowDate > normalizedToDate) return false;

    return true;
  });

  const isAnyFilterActive =
    filters.plannedDateFrom || filters.plannedDateTo || filters.customerName;

  // Update Mutation – now CP
  const updateMutation = useMutation({
    mutationFn: updateCPCanContactMeeting,
    onSuccess: () => {
      toast.success("Meeting updated successfully!");
      queryClient.invalidateQueries(["cp-meeting-can-contact"]);
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(
        "Error: " + (error?.response?.data?.message || error.message),
      );
    },
  });

  const handleActionClick = (lead) => {
    setSelectedLead(lead);
    setFormData({
      status: "",
      rescheduleDate: "",
      remarks: lead.remarks || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      status: "",
      rescheduleDate: "",
      remarks: "",
    });
  };

  const formatToSheetDateTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, "0");
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const cleanDateTime = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split(" ");
    if (parts.length > 2) return `${parts[0]} ${parts[1]}`;
    return dateStr;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.status) {
      toast.warning("Please select a status");
      return;
    }

    if (formData.status === "Reschedule" && !formData.rescheduleDate) {
      toast.warning("Please select a reschedule date");
      return;
    }

    if (
      ["Reschedule", "Negotiation Failed", "Deal Not Done"].includes(
        formData.status,
      ) &&
      !formData.remarks?.trim()
    ) {
      toast.warning("Please add remarks for this action");
      return;
    }

    const formattedDate = formatToSheetDateTime(formData.rescheduleDate);

    updateMutation.mutate({
      sheetName: selectedLead.sheetName,
      rowIndex: selectedLead.rowIndex,
      status: formData.status,
      rescheduleDate: formattedDate ? cleanDateTime(formattedDate) : undefined,
      remarks: formData.remarks?.trim() || "",
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      plannedDateFrom: "",
      plannedDateTo: "",
      customerName: "",
    });
  };

  const getLeadSourceBadge = (source) => {
    if (!source) return <span className="source-tag">-</span>;
    const sourceLower = source.toLowerCase();
    if (
      sourceLower.includes("channel") ||
      sourceLower.includes("partner") ||
      sourceLower.includes("cp")
    ) {
      return <span className="source-tag channel">{source}</span>;
    }
    return <span className="source-tag direct">{source}</span>;
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending" || s === "") {
      return <span className="status-tag pending">Pending</span>;
    } else if (s === "reschedule") {
      return <span className="status-tag call-again">Reschedule</span>;
    } else if (s === "done") {
      return <span className="status-tag done">Done</span>;
    }
    return <span className="status-tag">{status}</span>;
  };

  const statusOptions = [
    {
      value: "Done",
      label: "Done",
      icon: "bi-check-circle-fill",
      color: "#10b981",
    },
    {
      value: "Reschedule",
      label: "Reschedule",
      icon: "bi-calendar-event-fill",
      color: "#ec4899",
    },
    {
      value: "Not Interested",
      label: "Not Interested",
      icon: "bi-x-circle-fill",
      color: "#ef4444",
    },
    {
      value: "Negotiation Failed",
      label: "Negotiation Failed",
      icon: "bi-x-octagon-fill",
      color: "#dc2626",
    },
    {
      value: "Deal Not Done",
      label: "Deal Not Done",
      icon: "bi-hand-thumbs-down-fill",
      color: "#7c3aed",
    },
  ];

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Follow-up", path: "/cp-followup" },
        { name: "Meeting (Can Contact)", path: "/cp/meeting/can-contact" },
      ]}
    >
      <div className="table-page-container">
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #a855f7, #8b5cf6)" }}
          ></div>
        </div>

        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-calendar-check-fill"></i>
            </div>
            <div className="header-text">
              <h1>CP Meeting - Can Contact</h1>
              <p>Schedule and manage meetings with leads</p>
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

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-header">
            <div className="filter-title">
              <i className="bi bi-funnel"></i>
              <span>Filters</span>
              {isAnyFilterActive && (
                <span
                  className="active-filter-badge"
                  style={{
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
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
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                }}
              >
                <i
                  className={`bi bi-chevron-${showFilters ? "up" : "down"}`}
                ></i>
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              {isAnyFilterActive && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  <i className="bi bi-x-circle"></i>
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="filter-form">
              {/* Customer Name Filter */}
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-person-search"></i>
                  Customer Name
                </label>
                <div
                  className="search-input-wrapper"
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    name="customerName"
                    value={filters.customerName}
                    onChange={handleFilterChange}
                    placeholder="Search by customer name..."
                    className="search-input"
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "14px",
                      transition: "all 0.2s",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#8b5cf6";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(139, 92, 246, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  {filters.customerName && (
                    <button
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, customerName: "" }))
                      }
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Clear"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Planned Date Range Filter */}
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-calendar-range"></i>
                  Planned Date Range
                </label>
                <div className="date-range-filters">
                  <div className="date-input-group">
                    <label>From:</label>
                    <input
                      type="date"
                      name="plannedDateFrom"
                      value={filters.plannedDateFrom}
                      onChange={handleFilterChange}
                      className="date-input"
                    />
                  </div>
                  <div className="date-input-group">
                    <label>To:</label>
                    <input
                      type="date"
                      name="plannedDateTo"
                      value={filters.plannedDateTo}
                      onChange={handleFilterChange}
                      className="date-input"
                      min={filters.plannedDateFrom}
                    />
                  </div>
                </div>
              </div>

              {/* Filter Stats */}
              {isAnyFilterActive && (
                <div className="filter-stats">
                  <span className="filter-stat-item">
                    <i className="bi bi-filter-circle"></i>
                    Active Filters:
                  </span>
                  {filters.customerName && (
                    <span
                      className="filter-tag"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background:
                          "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                        color: "#6d28d9",
                      }}
                    >
                      <i className="bi bi-person"></i>
                      Name: "{filters.customerName}"
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, customerName: "" }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#6d28d9",
                          padding: "0",
                          marginLeft: "4px",
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </span>
                  )}
                  {filters.plannedDateFrom && (
                    <span className="filter-tag">
                      From: {filters.plannedDateFrom}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            plannedDateFrom: "",
                          }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "inherit",
                          padding: "0",
                          marginLeft: "4px",
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </span>
                  )}
                  {filters.plannedDateTo && (
                    <span className="filter-tag">
                      To: {filters.plannedDateTo}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, plannedDateTo: "" }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "inherit",
                          padding: "0",
                          marginLeft: "4px",
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </span>
                  )}
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
          ) : error ? (
            <div className="table-empty">
              <div className="empty-icon error">
                <i className="bi bi-exclamation-triangle"></i>
              </div>
              <h3>Please Refresh the page or try logout and login again</h3>
              <p>{error.message}</p>
              <button className="empty-clear-btn" onClick={() => refetch()}>
                <i className="bi bi-arrow-clockwise"></i>
                Try Again (Refresh the page)
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-calendar-x"></i>
              </div>
              <h3>No Meetings Found</h3>
              <p>
                {isAnyFilterActive
                  ? "No records match your filter criteria"
                  : "No pending meetings at the moment"}
              </p>
              {isAnyFilterActive && (
                <button className="empty-clear-btn" onClick={clearFilters}>
                  <i className="bi bi-funnel"></i>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="modern-table nbdin-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-content">#</div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-hash"></i>Unique ID
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person"></i>Customer Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-telephone"></i>Contact
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-heart"></i>Interested In
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-building"></i>Project
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-diagram-3"></i>Lead Source
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-phone"></i>Lead Gen No
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person-badge"></i>Lead Gen Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-flag"></i>Status
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar"></i>Planned
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-chat-left-text"></i>Remarks
                        </div>
                      </th>
                      <th className="th-action">
                        <div className="th-content">
                          <i className="bi bi-gear"></i>Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr
                        key={i}
                        className={
                          isPlannedDateUrgent(r.plannedDate)
                            ? "urgent-visit-row"
                            : ""
                        }
                        style={{ animationDelay: `${i * 0.02}s` }}
                      >
                        <td>
                          <span className="row-number">{i + 1}</span>
                        </td>
                        <td>
                          <span
                            className="id-badge"
                            style={{
                              background:
                                "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
                              color: "#6d28d9",
                            }}
                          >
                            {r.uniqueId || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="customer-name">
                            {filters.customerName ? (
                              <HighlightText
                                text={r.customerName || "-"}
                                highlight={filters.customerName}
                              />
                            ) : (
                              r.customerName || "-"
                            )}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`tel:${r.customerContact}`}
                            className="contact-link"
                          >
                            <i className="bi bi-telephone-fill"></i>
                            {r.customerContact || "-"}
                          </a>
                        </td>
                        <td>
                          <span className="interest-tag">
                            {r.interestedIn || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="project-name">
                            {r.projectSelection || "-"}
                          </span>
                        </td>
                        <td>{getLeadSourceBadge(r.leadSource)}</td>
                        <td>
                          <span className="lead-gen-number">
                            {r.leadGenNumber || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="lead-gen-name">
                            {r.leadGenName || "-"}
                          </span>
                        </td>
                        <td>{getStatusBadge(r.status)}</td>
                        <td>
                          <span
                            className={`planned-badge purple ${
                              isPlannedDateUrgent(r.plannedDate)
                                ? "urgent-badge"
                                : ""
                            }`}
                          >
                            <i className="bi bi-calendar-event"></i>
                            {r.plannedDate || "-"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="remarks-text"
                            style={{
                              maxWidth: "200px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                              cursor: "pointer",
                              color: "#6b7280",
                              fontSize: "0.85rem",
                            }}
                            title={r.remarks}
                          >
                            {r.remarks || "-"}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button
                            className="action-btn"
                            onClick={() => handleActionClick(r)}
                            style={{
                              background:
                                "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                            }}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="table-footer">
                <div className="footer-info">
                  <i
                    className="bi bi-info-circle"
                    style={{ color: "#8b5cf6" }}
                  ></i>
                  Showing <strong>{filteredRows.length}</strong> of{" "}
                  <strong>{rows.length}</strong> record
                  {filteredRows.length !== 1 ? "s" : ""}
                </div>
                <div className="footer-actions">
                  {isAnyFilterActive && (
                    <button
                      className="clear-filter-btn"
                      onClick={clearFilters}
                      style={{
                        background:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      }}
                    >
                      <i className="bi bi-x-circle"></i>
                      Clear Filter
                    </button>
                  )}
                  <button className="refresh-btn" onClick={() => refetch()}>
                    <i className="bi bi-arrow-clockwise"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Modal */}
        {showModal && selectedLead && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="modal-header-custom"
                style={{
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-calendar-check-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Update Meeting</h2>
                    <div className="modal-subtitle">
                      <span className="contact-badge">
                        <i className="bi bi-telephone"></i>
                        {selectedLead.customerContact}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-person"></i>
                        {selectedLead.customerName}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body-custom">
                {/* Lead Info Card */}
                <div className="lead-info-card">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi bi-telephone"></i>
                        Contact
                      </span>
                      <span className="info-value">
                        <a
                          href={`tel:${selectedLead.customerContact}`}
                          className="contact-link-modal"
                        >
                          {selectedLead.customerContact}
                        </a>
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi bi-calendar"></i>
                        Planned Date
                      </span>
                      <span className="info-value">
                        <span className="planned-tag purple">
                          {selectedLead.plannedDate}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi bi-building"></i>
                        Project
                      </span>
                      <span className="info-value">
                        {selectedLead.projectSelection || "-"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi bi-heart"></i>
                        Interested In
                      </span>
                      <span className="info-value">
                        {selectedLead.interestedIn || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Status Selection */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-tag-fill"
                        style={{ color: "#8b5cf6" }}
                      ></i>
                      Status <span className="required">*</span>
                    </label>
                    <div
                      className="status-grid"
                      style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                    >
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`status-option ${
                            formData.status === option.value ? "active" : ""
                          }`}
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

                  {/* Reschedule Date */}
                  {formData.status === "Reschedule" && (
                    <div
                      className="form-section meeting-date-section"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)",
                        borderColor: "rgba(139, 92, 246, 0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#8b5cf6" }}
                        ></i>
                        Reschedule Date <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="datetime-local"
                          className="form-input-custom"
                          value={formData.rescheduleDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              rescheduleDate: e.target.value,
                            })
                          }
                          required
                          style={{ color: "#000", backgroundColor: "#fff" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Old Remarks */}
                  {selectedLead.oldRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-clock-history"
                          style={{ color: "#6b7280" }}
                        ></i>
                        Initial Remarks
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
                          backgroundColor: "#f9fafb",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          borderLeft: "3px solid #6b7280",
                          color: "#4b5563",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          minHeight: "50px",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {selectedLead.oldRemarks}
                      </div>
                    </div>
                  )}

                  {/* Previous Remarks */}
                  {selectedLead.previousRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-left-text"
                          style={{ color: "#ec4899" }}
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
                          backgroundColor: "#fce7f3",
                          border: "1px solid #fbcfe8",
                          borderRadius: "8px",
                          borderLeft: "3px solid #ec4899",
                          color: "#be185d",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          minHeight: "50px",
                        }}
                      >
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: selectedLead.previousRemarksDate
                              ? "8px"
                              : "0",
                          }}
                        >
                          {selectedLead.previousRemarks}
                        </div>
                        {selectedLead.previousRemarksDate && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              color: "#db2777",
                              borderTop: "1px dashed #fbbf24",
                              paddingTop: "8px",
                              marginTop: "4px",
                            }}
                          >
                            <i
                              className="bi bi-calendar3"
                              style={{ fontSize: "11px" }}
                            ></i>
                            <span>{selectedLead.previousRemarksDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Latest Old Remarks */}
                  {selectedLead.latestOldRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-square-dots"
                          style={{ color: "#3b82f6" }}
                        ></i>
                        Latest Old Remarks
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
                          backgroundColor: "#eff6ff",
                          border: "1px solid #dbeafe",
                          borderRadius: "8px",
                          borderLeft: "3px solid #3b82f6",
                          color: "#1e40af",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          minHeight: "50px",
                        }}
                      >
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: selectedLead.latestOldRemarksDate
                              ? "8px"
                              : "0",
                          }}
                        >
                          {selectedLead.latestOldRemarks}
                        </div>
                        {selectedLead.latestOldRemarksDate && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              color: "#2563eb",
                              borderTop: "1px dashed #bfdbfe",
                              paddingTop: "8px",
                              marginTop: "4px",
                            }}
                          >
                            <i
                              className="bi bi-calendar3"
                              style={{ fontSize: "11px" }}
                            ></i>
                            <span>{selectedLead.latestOldRemarksDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Remarks */}
                  {selectedLead.recentRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-dots"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        Recent Remarks
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
                          backgroundColor: "#fef3c7",
                          border: "1px solid #fde68a",
                          borderRadius: "8px",
                          borderLeft: "3px solid #f59e0b",
                          color: "#92400e",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          minHeight: "50px",
                        }}
                      >
                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            marginBottom: selectedLead.recentRemarksDate
                              ? "8px"
                              : "0",
                          }}
                        >
                          {selectedLead.recentRemarks}
                        </div>
                        {selectedLead.recentRemarksDate && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "12px",
                              color: "#d97706",
                              borderTop: "1px dashed #fed7aa",
                              paddingTop: "8px",
                              marginTop: "4px",
                            }}
                          >
                            <i
                              className="bi bi-calendar3"
                              style={{ fontSize: "11px" }}
                            ></i>
                            <span>{selectedLead.recentRemarksDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* New Remarks */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-square-text-fill"
                        style={{ color: "#8b5cf6" }}
                      ></i>
                      New Remarks
                    </label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea-custom"
                        placeholder={
                          formData.status === "Reschedule"
                            ? "Reason for rescheduling..."
                            : formData.status === "Negotiation Failed"
                              ? "Reason why negotiation failed..."
                              : formData.status === "Deal Not Done"
                                ? "Reason why deal is not done..."
                                : "Enter new remarks..."
                        }
                        value={formData.remarks}
                        onChange={(e) =>
                          setFormData({ ...formData, remarks: e.target.value })
                        }
                        rows={3}
                        style={{
                          borderLeft: "3px solid #8b5cf6",
                        }}
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  <i className="bi bi-x-circle"></i>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending || !formData.status}
                  style={{
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>
                      Updating...
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
        )}
      </div>
    </Layout>
  );
}

// HighlightText (unchanged)
const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;

  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            style={{
              backgroundColor: "#ede9fe",
              color: "#6d28d9",
              padding: "0 2px",
              borderRadius: "2px",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </span>
  );
};

export default CPMeetingCanContact;
