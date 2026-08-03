import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCPCanContactBooking,
  updateCPCanContactBooking,
} from "../../services/cpApi"; // ← changed import
import Layout from "../../components/Layout";
import SkeletonTable from "../../components/SkeletonTable";
import "../../assets/styles/TablePages.css";
import "../../assets/styles/ActionModal.css";
import { toast } from "react-toastify";

function CPBookingCanContact() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    status: "Done",
    block: "",
    unitNo: "",
    remarks: "",
  });

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
    queryKey: ["cp-booking-can-contact"],
    queryFn: fetchCPCanContactBooking,
    select: (res) => res?.data || res || [],
    staleTime: 1000 * 60 * 5,
  });

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
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    };

    const rowDate = parseDate(plannedDate);
    if (!rowDate) return false;

    const fromDate = filters.plannedDateFrom ? new Date(filters.plannedDateFrom) : null;
    const toDate = filters.plannedDateTo ? new Date(filters.plannedDateTo) : null;

    const normalizeDate = (date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizedRowDate = normalizeDate(rowDate);
    const normalizedFromDate = fromDate ? normalizeDate(fromDate) : null;
    const normalizedToDate = toDate ? normalizeDate(toDate) : null;

    if (normalizedFromDate && normalizedRowDate < normalizedFromDate) return false;
    if (normalizedToDate && normalizedRowDate > normalizedToDate) return false;

    return true;
  });

  const isAnyFilterActive = filters.plannedDateFrom || filters.plannedDateTo || filters.customerName;

  // Update Mutation – now using CP API
  const updateMutation = useMutation({
    mutationFn: updateCPCanContactBooking,
    onSuccess: () => {
      toast.success("Booking Done Successfully!");
      queryClient.invalidateQueries(["cp-booking-can-contact"]);
      handleCloseModal();
    },
    onError: (error) => {
      toast.error("Error: " + (error?.response?.data?.message || error.message));
    },
  });

  const handleActionClick = (lead) => {
    setSelectedLead(lead);
    setFormData({
      status: "Done",
      block: lead.block || "",
      unitNo: lead.unitNo || "",
      remarks: lead.remarks || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      status: "Done",
      block: "",
      unitNo: "",
      remarks: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.block?.trim()) {
      toast.warning("Please enter Block");
      return;
    }

    if (!formData.unitNo?.trim()) {
      toast.warning("Please enter Unit No");
      return;
    }

    updateMutation.mutate({
      sheetName: selectedLead.sheetName,
      rowIndex: selectedLead.rowIndex,
      status: "Done",
      block: formData.block.trim(),
      unitNo: formData.unitNo.trim(),
      remarks: formData.remarks.trim(),
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
    } else if (s === "done") {
      return <span className="status-tag done">Done</span>;
    }
    return <span className="status-tag">{status}</span>;
  };

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Follow-up", path: "/cp-followup" },
        { name: "Booking (Can Contact)", path: "/cp/booking/can-contact" },
      ]}
    >
      <div className="table-page-container">
        {/* Background Elements */}
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
          ></div>
        </div>

        {/* Header Section */}
        <div
          className="table-page-header"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-bookmark-check-fill"></i>
            </div>
            <div className="header-text">
              <h1>CP Booking - Can Contact</h1>
              <p>Manage and track property bookings</p>
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

              {/* Filter Section - UPDATED */}
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
                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
              {/* Customer Name Filter - NEW */}
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
                      e.target.style.borderColor = "#10b981";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(16, 185, 129, 0.1)";
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

              {/* Filter Stats - UPDATED */}
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
                          "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                        color: "#047857",
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
                          color: "#047857",
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
              <h3>Error Loading Data</h3>
              <p>{error.message}</p>
              <button className="empty-clear-btn" onClick={() => refetch()}>
                <i className="bi bi-arrow-clockwise"></i>
                Try Again
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-bookmark-x"></i>
              </div>
              <h3>No Bookings Found</h3>
              <p>
                {isAnyFilterActive
                  ? "No records match your filter criteria"
                  : "No pending bookings at the moment"}
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
                      <th className="th-action">
                        <div className="th-content">
                          <i className="bi bi-gear"></i>Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} style={{ animationDelay: `${i * 0.02}s` }}>
                        <td>
                          <span className="row-number">{i + 1}</span>
                        </td>
                        <td>
                          <span
                            className="id-badge"
                            style={{
                              background:
                                "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                              color: "#047857",
                            }}
                          >
                            {r.uniqueId || "-"}
                          </span>
                        </td>
                        {/* Customer Name - WITH HIGHLIGHT */}
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
                          <span className="planned-badge green">
                            <i className="bi bi-calendar-event"></i>
                            {r.plannedDate || "-"}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button
                            className="action-btn"
                            onClick={() => handleActionClick(r)}
                            style={{
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
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
                    style={{ color: "#10b981" }}
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

        {/* ================== ACTION MODAL ================== */}
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
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        }}
      >
        <div className="modal-header-content">
          <div className="modal-icon">
            <i className="bi bi-bookmark-check-fill"></i>
          </div>
          <div className="modal-header-text">
            <h2>Complete Booking</h2>
            <div className="modal-subtitle">
              <span className="firm-badge">
                <i className="bi bi-hash"></i>
                {selectedLead.uniqueId}
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
                <span className="planned-tag green">
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
          {/* Status - Done Only (Read Only Display) */}
          <div className="form-section">
            <label className="form-label-custom">
              <i className="bi bi-check-circle-fill" style={{ color: "#10b981" }}></i>
              Status
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                borderRadius: "10px",
                border: "2px solid #10b981",
              }}
            >
              <i className="bi bi-check-circle-fill" style={{ color: "#059669", fontSize: "20px" }}></i>
              <span style={{ color: "#047857", fontWeight: "600", fontSize: "16px" }}>
                Done
              </span>
            </div>
          </div>

          {/* Block & Unit No Fields */}
          <div
            className="form-section"
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Block Input */}
              <div>
                <label className="form-label-custom">
                  <i className="bi bi-building" style={{ color: "#10b981" }}></i>
                  Block <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-input-custom"
                    placeholder="Enter Block (e.g., A, B, C)"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    style={{
                      color: "#000",
                      backgroundColor: "#fff",
                      borderLeft: "3px solid #10b981",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      width: "100%",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Unit No Input */}
              <div>
                <label className="form-label-custom">
                  <i className="bi bi-door-open" style={{ color: "#10b981" }}></i>
                  Unit No <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="form-input-custom"
                    placeholder="Enter Unit No (e.g., 101, 202)"
                    value={formData.unitNo}
                    onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
                    style={{
                      color: "#000",
                      backgroundColor: "#fff",
                      borderLeft: "3px solid #10b981",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      width: "100%",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal Footer */}
      <div className="modal-footer-custom">
        <button type="button" className="btn-cancel" onClick={handleCloseModal}>
          <i className="bi bi-x-circle"></i>
          Cancel
        </button>
        

        {/* ← New Booking Form Link Button */}
        <a
          href="https://script.google.com/a/macros/vipinchauhanassociates.com/s/AKfycbxK1iWb0u9uRHZUeZpgvxHIK0VWqQVHqaHJf4o77A/dev"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-booking-link"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: "500",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <i className="bi bi-box-arrow-up-right"></i>
          Booking Form Link
        </a>

        <button
          type="submit"
          className="btn-submit"
          onClick={handleSubmit}
          disabled={updateMutation.isPending}
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          }}
        >
          {updateMutation.isPending ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            <>
              <i className="bi bi-check-circle-fill"></i>
              Confirm Booking
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

// HighlightText component (unchanged)
const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(
    `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            style={{
              backgroundColor: "#d1fae5",
              color: "#047857",
              padding: "0 2px",
              borderRadius: "2px",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default CPBookingCanContact;