import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCPCanContactFieldVisit,
  updateCPCanContactFieldVisit,
} from "../../services/cpApi";
import Layout from "../../components/Layout";
import SkeletonTable from "../../components/SkeletonTable";
import "../../assets/styles/TablePages.css";
import "../../assets/styles/ActionModal.css";
import { toast } from "react-toastify";

function CPFieldVisitCanContact() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [actionType, setActionType] = useState("done");
  const [formData, setFormData] = useState({
    status: "Done",
    remarks: "",
    rescheduleDate: "",
    importantNote: "",
  });
  const [filters, setFilters] = useState({
    plannedDateFrom: "",
    plannedDateTo: "",
    customerName: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cp-field-visit-can-contact"],
    queryFn: fetchCPCanContactFieldVisit,
    select: (res) => res?.data || res || [],
    staleTime: 1000 * 60 * 5,
  });

  const isPlannedDateUrgent = (plannedDateStr) => {
    if (!plannedDateStr) return false;
    const parts = plannedDateStr.split("/");
    if (parts.length !== 3) return false;
    const plannedDate = new Date(
      parseInt(parts[2], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[0], 10),
    );
    plannedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return plannedDate <= today;
  };

  const filteredRows = rows.filter((row) => {
    if (filters.customerName) {
      const customerName = row.customerName?.toLowerCase() || "";
      if (!customerName.includes(filters.customerName.toLowerCase().trim()))
        return false;
    }
    if (!filters.plannedDateFrom && !filters.plannedDateTo) return true;
    const plannedDate = row.plannedDate;
    if (!plannedDate) return false;
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split("/");
      if (parts.length !== 3) return null;
      return new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10),
      );
    };
    const rowDate = parseDate(plannedDate);
    if (!rowDate) return false;
    const norm = (d) => {
      const n = new Date(d);
      n.setHours(0, 0, 0, 0);
      return n;
    };
    const nr = norm(rowDate);
    if (filters.plannedDateFrom && nr < norm(new Date(filters.plannedDateFrom)))
      return false;
    if (filters.plannedDateTo && nr > norm(new Date(filters.plannedDateTo)))
      return false;
    return true;
  });

  const isAnyFilterActive =
    filters.plannedDateFrom || filters.plannedDateTo || filters.customerName;



  const updateMutation = useMutation({
    mutationFn: updateCPCanContactFieldVisit,
    onSuccess: (data) => {
      toast.success(data.message || "Field visit updated successfully!");
      queryClient.invalidateQueries(["cp-field-visit-can-contact"]);
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update");
    },
  });

  const handleAction = (lead) => {
    setSelectedLead(lead);
    setActionType("done");
    setFormData({
      status: "Done",
      remarks: "",
      rescheduleDate: "",
      importantNote: lead.importantNote || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      status: "Done",
      remarks: "",
      rescheduleDate: "",
      importantNote: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (actionType === "reschedule" && !formData.rescheduleDate) {
      toast.error("Please select a date to reschedule.");
      return;
    }
    if (actionType === "no-connection" && !formData.rescheduleDate) {
      toast.error("Please select next planned date.");
      return;
    }

    const payload = {
      sheetName: selectedLead.sheetName,
      rowIndex: selectedLead.rowIndex,
      remarks: formData.remarks,
    };

    if (actionType === "done") {
      payload.status = "Done";
    } else if (actionType === "reschedule") {
      payload.rescheduleDate = formData.rescheduleDate;
    } else if (actionType === "not-interested") {
      payload.status = "Not Interested";
    } else if (actionType === "no-connection") {
      payload.status = "No Connection";
      payload.rescheduleDate = formData.rescheduleDate;
    }

    updateMutation.mutate(payload);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };
  const clearFilters = () =>
    setFilters({ plannedDateFrom: "", plannedDateTo: "", customerName: "" });

  const getSourceBadge = (source) => {
    if (!source) return <span className="source-tag">-</span>;
    const s = source.toLowerCase();
    if (s.includes("channel") || s.includes("partner") || s.includes("cp"))
      return <span className="source-tag channel">{source}</span>;
    return <span className="source-tag direct">{source}</span>;
  };

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Follow-up", path: "/cp-followup" },
        {
          name: "Field Visit (Can Contact)",
          path: "/cp/field-visit/can-contact",
        },
      ]}
    >
      <div className="table-page-container">
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #f472b6, #ec4899)" }}
          ></div>
        </div>

        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <div className="header-text">
              <h1>CP Field Visit - Can Contact</h1>
              <p>Schedule and track field visits with channel partners</p>
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
                      "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
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
                    "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
                }}
              >
                <i
                  className={`bi bi-chevron-${showFilters ? "up" : "down"}`}
                ></i>
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              {isAnyFilterActive && (
                <button className="clear-filters-btn" onClick={clearFilters}>
                  <i className="bi bi-x-circle"></i>Clear Filters
                </button>
              )}
            </div>
          </div>
          {showFilters && (
            <div className="filter-form">
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-person-search"></i> Customer Name
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="customerName"
                    value={filters.customerName}
                    onChange={handleFilterChange}
                    placeholder="Search by customer name..."
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#ec4899";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(236, 72, 153, 0.1)";
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
                        setFilters((p) => ({ ...p, customerName: "" }))
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
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-calendar-range"></i> Planned Date Range
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
              {isAnyFilterActive && (
                <div className="filter-stats">
                  <span className="filter-stat-item">
                    <i className="bi bi-filter-circle"></i> Active Filters:
                  </span>
                  {filters.customerName && (
                    <span
                      className="filter-tag"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background:
                          "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                        color: "#be185d",
                      }}
                    >
                      <i className="bi bi-person"></i>Name: "
                      {filters.customerName}"
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((p) => ({ ...p, customerName: "" }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#be185d",
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
                          setFilters((p) => ({ ...p, plannedDateFrom: "" }))
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
                          setFilters((p) => ({ ...p, plannedDateTo: "" }))
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
                <i className="bi bi-arrow-clockwise"></i> Try Again (Refresh the page)
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h3>No Field Visits Found</h3>
              <p>
                {isAnyFilterActive
                  ? "No records match your filter criteria"
                  : "No pending field visits at the moment"}
              </p>
              {isAnyFilterActive && (
                <button className="empty-clear-btn" onClick={clearFilters}>
                  <i className="bi bi-funnel"></i> Clear Filters
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
                          <i className="bi bi-hash"></i> Unique ID
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person"></i> Customer Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-telephone"></i> Contact
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-heart"></i> Interested In
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-building"></i> Project
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-diagram-3"></i> Lead Source
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-phone"></i> Lead Gen No
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person-badge"></i> Lead Gen Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar"></i> Planned
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-arrow-repeat"></i> Followups
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-chat-text"></i> Remarks
                        </div>
                      </th>
                      <th className="th-action">
                        <div className="th-content">
                          <i className="bi bi-gear"></i> Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr
                        key={`${r.sheetName}-${r.rowIndex}`}
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
                                "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
                              color: "#be185d",
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
                        <td>{getSourceBadge(r.leadSource)}</td>
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
                        <td>
                          <span
                            className={`planned-badge pink ${isPlannedDateUrgent(r.plannedDate) ? "urgent-badge" : ""}`}
                          >
                            <i className="bi bi-calendar-event"></i>
                            {r.plannedDate || "-"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="followup-badge"
                            style={{
                              background:
                                r.followupCount >= 5
                                  ? "#ef4444"
                                  : r.followupCount >= 3
                                    ? "#f59e0b"
                                    : "#10b981",
                              color: "white",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontWeight: "bold",
                              minWidth: "32px",
                              textAlign: "center",
                            }}
                          >
                            {r.followupCount || 0}
                          </span>
                        </td>
                        <td>
                          <span
                            className="remarks-text"
                            style={{
                              maxWidth: "200px",
                              display: "inline-block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: "#6b7280",
                            }}
                            title={r.remarks}
                          >
                            {r.remarks || "-"}
                          </span>
                        </td>
                        <td className="action-cell">
                          <button
                            className="action-btn"
                            onClick={() => handleAction(r)}
                            style={{
                              background:
                                "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
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
              <div className="table-footer">
                <div className="footer-info">
                  <i
                    className="bi bi-info-circle"
                    style={{ color: "#ec4899" }}
                  ></i>{" "}
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
                      <i className="bi bi-x-circle"></i> Clear Filter
                    </button>
                  )}
                  <button className="refresh-btn" onClick={() => refetch()}>
                    <i className="bi bi-arrow-clockwise"></i> Refresh
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedLead && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-header-custom"
                style={{
                  background:
                    "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-geo-alt-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Update Field Visit</h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge">
                        <i className="bi bi-hash"></i>
                        {selectedLead.uniqueId}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-person"></i>
                        {selectedLead.customerName}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-telephone"></i>
                        {selectedLead.customerContact}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body-custom">
                <div className="form-section">
                  <label className="form-label-custom">Select Action</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                    }}
                  >
                    {/* Mark as Done */}
                    <div
                      onClick={() => setActionType("done")}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "done" ? "#10b981" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "done"
                            ? "rgba(16, 185, 129, 0.05)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
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
                        Mark as Done
                      </span>
                    </div>
                    {/* Reschedule */}
                    <div
                      onClick={() => setActionType("reschedule")}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "reschedule" ? "#ec4899" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "reschedule"
                            ? "rgba(236, 72, 153, 0.05)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <i
                        className="bi bi-calendar-event-fill"
                        style={{
                          color: "#ec4899",
                          fontSize: "1.5rem",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      ></i>
                      <span style={{ fontWeight: "600", color: "#374151" }}>
                        Reschedule
                      </span>
                    </div>
                    {/* Not Interested */}
                    <div
                      onClick={() => setActionType("not-interested")}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "not-interested" ? "#ef4444" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "not-interested"
                            ? "rgba(239, 68, 68, 0.08)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <i
                        className="bi bi-x-circle-fill"
                        style={{
                          color:
                            actionType === "not-interested"
                              ? "#ef4444"
                              : "#9ca3af",
                          fontSize: "1.5rem",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      ></i>
                      <span
                        style={{
                          fontWeight: "600",
                          color:
                            actionType === "not-interested"
                              ? "#ef4444"
                              : "#374151",
                        }}
                      >
                        Not Interested
                      </span>
                    </div>
                    {/* No Connection */}
                    <div
                      onClick={() => setActionType("no-connection")}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "no-connection" ? "#f59e0b" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "no-connection"
                            ? "rgba(245,158,11,0.08)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s",
                      }}
                    >
                      <i
                        className="bi bi-telephone-x-fill"
                        style={{
                          color:
                            actionType === "no-connection"
                              ? "#f59e0b"
                              : "#9ca3af",
                          fontSize: "1.5rem",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      ></i>
                      <span
                        style={{
                          fontWeight: "600",
                          color:
                            actionType === "no-connection"
                              ? "#f59e0b"
                              : "#374151",
                        }}
                      >
                        No Connection
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Reschedule Date */}
                  {actionType === "reschedule" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s ease-in-out" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#ec4899" }}
                        ></i>{" "}
                        New Visit Date <span className="required">*</span>
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
                          min={new Date().toISOString().split("T")[0]}
                          style={{ color: "#000", background: "#fff" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* No Connection Date */}
                  {actionType === "no-connection" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s ease-in-out" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#f59e0b" }}
                        ></i>{" "}
                        Next Planned Date <span className="required">*</span>
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
                          min={new Date().toISOString().split("T")[0]}
                          style={{ color: "#000", background: "#fff" }}
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
                        ></i>{" "}
                        Old Remarks{" "}
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
                          style={{ color: "#8b5cf6" }}
                        ></i>{" "}
                        Previous Remarks{" "}
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
                              color: "#7c3aed",
                              borderTop: "1px dashed #ddd6fe",
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

                  {/* New Remarks */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-square-text-fill"
                        style={{ color: "#ec4899" }}
                      ></i>{" "}
                      New Remarks
                    </label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea-custom"
                        placeholder={
                          actionType === "done"
                            ? "Remarks about the visit..."
                            : actionType === "reschedule"
                              ? "Reason for rescheduling..."
                              : actionType === "no-connection"
                                ? "Details about no connection..."
                                : "Reason for marking not interested..."
                        }
                        value={formData.remarks}
                        onChange={(e) =>
                          setFormData({ ...formData, remarks: e.target.value })
                        }
                        rows={3}
                        style={{
                          color: "#000",
                          borderLeft: "3px solid #ec4899",
                        }}
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>

              <div className="modal-footer-custom">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                >
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={
                    updateMutation.isPending ||
                    (actionType === "reschedule" && !formData.rescheduleDate) ||
                    (actionType === "no-connection" && !formData.rescheduleDate)
                  }
                  style={{
                    background:
                      actionType === "no-connection"
                        ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                        : "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div> Processing...
                    </>
                  ) : actionType === "done" ? (
                    <>
                      <i className="bi bi-check2-all"></i> Complete Visit
                    </>
                  ) : actionType === "not-interested" ? (
                    <>
                      <i className="bi bi-x-circle"></i> Mark Not Interested
                    </>
                  ) : actionType === "no-connection" ? (
                    <>
                      <i className="bi bi-telephone-x"></i> Mark No Connection
                    </>
                  ) : (
                    <>
                      <i className="bi bi-calendar-check"></i> Reschedule
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
              backgroundColor: "#fce7f3",
              color: "#be185d",
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

export default CPFieldVisitCanContact;
