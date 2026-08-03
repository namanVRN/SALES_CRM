import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCallToBrokerData,
  submitCallToBrokerAction,
} from "../services/fmsApi";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import { toast } from "react-toastify";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

const IMPORTANT_STORAGE_KEY = "callToBroker_importantLeads";

function CallToBroker() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    nextFollowUpDate: "",
    isLeadQualified: "",
    contactPersonName: "",
    rera: "",
    remarks: "",
    meetingDate: "",
  });

  const [filters, setFilters] = useState({
    customerName: "",
    todayOnly: false,
    fromDate: "",
    toDate: "",
    minFollowUp: "",
    maxFollowUp: "",
    importantOnly: false, // ✅ NEW filter
  });
  const [showFilters, setShowFilters] = useState(false);

  // ✅ Important leads state — stored in localStorage
  const [importantLeads, setImportantLeads] = useState(() => {
    try {
      const stored = localStorage.getItem(IMPORTANT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage whenever importantLeads changes
  useEffect(() => {
    localStorage.setItem(IMPORTANT_STORAGE_KEY, JSON.stringify(importantLeads));
  }, [importantLeads]);

  // ✅ Toggle important
  const toggleImportant = useCallback((uniqueId) => {
    setImportantLeads((prev) => {
      const isCurrentlyImportant = prev.includes(uniqueId);
      if (isCurrentlyImportant) {
        toast.info("⭐ Removed from Important", { autoClose: 1500 });
        return prev.filter((id) => id !== uniqueId);
      } else {
        toast.success("⭐ Marked as Important!", { autoClose: 1500 });
        return [...prev, uniqueId];
      }
    });
  }, []);

  const isImportant = useCallback(
    (uniqueId) => importantLeads.includes(uniqueId),
    [importantLeads],
  );

  // Parse DD/MM/YYYY to Date object
  const parseDDMMYYYY = (str) => {
    if (!str) return null;
    const datePart = String(str).split(" ")[0];
    const parts = datePart.split("/");
    if (parts.length !== 3) return null;
    const d = new Date(
      parseInt(parts[2], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[0], 10),
    );
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  };

  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["callToBroker"],
    queryFn: fetchCallToBrokerData,
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
  });

  const getDisplayPlannedDate = (row) => {
    return row.nextFollowUpDate || row.plannedDate || "";
  };

  const isPlannedDateUrgent = (p) => {
    if (!p) return false;
    const parts = p.split("/");
    if (parts.length !== 3) return false;
    const pd = new Date(
      parseInt(parts[2], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[0], 10),
    );
    pd.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return pd <= t;
  };

  const filteredRows = rows.filter((row) => {
    // ✅ Important only filter
    if (filters.importantOnly) {
      if (!importantLeads.includes(row.uniqueId)) return false;
    }

    // Smart search — firm name OR contact
    if (filters.customerName) {
      const searchTerm = filters.customerName.toLowerCase().trim();
      const firmMatch = (row.firmName?.toLowerCase() || "").includes(
        searchTerm,
      );
      const contactMatch = (row.contact?.toString() || "").includes(searchTerm);
      if (!firmMatch && !contactMatch) return false;
    }

    // Today only
    if (filters.todayOnly) {
      const pd = row.nextFollowUpDate || row.plannedDate;
      const planned = parseDDMMYYYY(pd);
      if (!planned) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (planned.getTime() !== today.getTime()) return false;
    }

    // Planned Date Range
    if (filters.fromDate || filters.toDate) {
      const pd = row.nextFollowUpDate || row.plannedDate;
      const planned = parseDDMMYYYY(pd);
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

    // Follow Up Count range
    const count = parseInt(row.followUpCounter) || 0;
    if (filters.minFollowUp !== "" && count < parseInt(filters.minFollowUp))
      return false;
    if (filters.maxFollowUp !== "" && count > parseInt(filters.maxFollowUp))
      return false;

    return true;
  });

  // ✅ Sort — important leads first
  const sortedFilteredRows = [...filteredRows].sort((a, b) => {
    const aImp = importantLeads.includes(a.uniqueId) ? 1 : 0;
    const bImp = importantLeads.includes(b.uniqueId) ? 1 : 0;
    return bImp - aImp; // important ones come first
  });

  const isAnyFilterActive =
    filters.customerName ||
    filters.todayOnly ||
    filters.fromDate ||
    filters.toDate ||
    filters.minFollowUp !== "" ||
    filters.maxFollowUp !== "" ||
    filters.importantOnly;

  const getMinDateTime = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}T${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  };
  const isDateTimeInPast = (v) => (v ? new Date(v) < new Date() : false);
  const isTimeAfter6PM = (v) => (v ? new Date(v).getHours() >= 18 : false);
  const handleDateTimeChange = (field, value) => {
    if (isDateTimeInPast(value)) {
      toast.warning("⚠️ Past date और time select नहीं कर सकते!");
      return;
    }
    if (isTimeAfter6PM(value)) {
      toast.warning("⏰ 6 PM के बाद का time select नहीं कर सकते!");
      const d = new Date(value);
      d.setHours(18, 0, 0, 0);
      setFormData({ ...formData, [field]: d.toISOString().slice(0, 16) });
      return;
    }
    setFormData({ ...formData, [field]: value });
  };

  const updateMutation = useMutation({
    mutationFn: submitCallToBrokerAction,
    onSuccess: (d) => {
      toast.success(d.message || "Updated!");
      queryClient.invalidateQueries(["callToBroker"]);
      handleCloseModal();
    },
    onError: (e) => {
      toast.error(e?.message || "Failed to update");
    },
  });

  const handleAction = (lead) => {
    setSelectedLead(lead);
    setFormData({
      status: "",
      nextFollowUpDate: "",
      isLeadQualified: lead.isLeadQualified || "",
      contactPersonName: lead.contactPersonName || "",
      rera: lead.rera || "",
      remarks: "",
      meetingDate: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      status: "",
      nextFollowUpDate: "",
      isLeadQualified: "",
      contactPersonName: "",
      rera: "",
      remarks: "",
      meetingDate: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.status) {
      toast.warning("Please select a status");
      return;
    }
    if (formData.status === "Call Again" && !formData.nextFollowUpDate) {
      toast.error("Next Follow-Up Date select करें!");
      return;
    }
    if (formData.status === "Agreed to next meeting" && !formData.meetingDate) {
      toast.error("Meeting Date select करें!");
      return;
    }
    if (
      formData.nextFollowUpDate &&
      isDateTimeInPast(formData.nextFollowUpDate)
    ) {
      toast.error("Past date select नहीं कर सकते!");
      return;
    }
    if (formData.meetingDate && isDateTimeInPast(formData.meetingDate)) {
      toast.error("Past date select नहीं कर सकते!");
      return;
    }

    updateMutation.mutate({
      rowIndex: selectedLead.rowIndex,
      status: formData.status,
      nextFollowUpDate: formData.nextFollowUpDate || null,
      isLeadQualified: formData.isLeadQualified || null,
      contactPersonName: formData.contactPersonName || "",
      rera: formData.rera || null,
      remarks: formData.remarks || "",
      meetingDate: formData.meetingDate || null,
    });
  };

  const clearFilters = () =>
    setFilters({
      customerName: "",
      todayOnly: false,
      fromDate: "",
      toDate: "",
      minFollowUp: "",
      maxFollowUp: "",
      importantOnly: false,
    });

  const statusOptions = [
    {
      value: "Call Again",
      label: "Call Again",
      icon: "bi-telephone-forward",
      color: "#8b5cf6",
    },
    {
      value: "Agreed to next meeting",
      label: "Agreed to Meeting",
      icon: "bi-calendar-check",
      color: "#10b981",
    },
    {
      value: "Not interested",
      label: "Not Interested",
      icon: "bi-x-circle",
      color: "#ef4444",
    },
    { value: "CRR", label: "CRR", icon: "bi-arrow-repeat", color: "#6366f1" },
    {
      value: "Not Eligible",
      label: "Not Eligible",
      icon: "bi-slash-circle",
      color: "#f97316",
    },
    {
      value: "No Connection",
      label: "No Connection (15+ Days)",
      icon: "bi-wifi-off",
      color: "#0ea5e9",
    },
  ];

  // ✅ Count of important leads in current data
  const importantCount = rows.filter((r) =>
    importantLeads.includes(r.uniqueId),
  ).length;

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Outgoing", path: "/channel-partner/cp-outgoing/" },
        { name: "Call to Broker", path: "/call-to-broker" },
      ]}
    >
      <div className="table-page-container">
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
          ></div>
        </div>
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-telephone-inbound-fill"></i>
            </div>
            <div className="header-text">
              <h1>Call to Broker</h1>
              <p>Track and manage broker call activities</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{sortedFilteredRows.length}</span>
              <span className="stat-label">
                {isAnyFilterActive ? "Filtered" : "Leads"}
              </span>
            </div>
            {/* ✅ Important count stat */}
            {importantCount > 0 && (
              <div
                className="stat-box"
                style={{
                  cursor: "pointer",
                  border: filters.importantOnly
                    ? "2px solid #fbbf24"
                    : "2px solid transparent",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                }}
                onClick={() =>
                  setFilters((p) => ({
                    ...p,
                    importantOnly: !p.importantOnly,
                  }))
                }
                title="Click to toggle Important filter"
              >
                <span className="stat-number">
                  <i
                    className="bi bi-star-fill"
                    style={{ color: "#fbbf24", marginRight: "4px" }}
                  ></i>
                  {importantCount}
                </span>
                <span className="stat-label">Important</span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <div className="filter-header">
            <div className="filter-title">
              <i className="bi bi-funnel"></i>
              <span>Filters</span>
              {isAnyFilterActive && (
                <span
                  style={{
                    background: "linear-gradient(135deg,#0891b2,#0e7490)",
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
              {/* ✅ Important Filter Quick Toggle */}
              <button
                type="button"
                onClick={() =>
                  setFilters((p) => ({
                    ...p,
                    importantOnly: !p.importantOnly,
                  }))
                }
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: filters.importantOnly
                    ? "2px solid #f59e0b"
                    : "1px solid #e5e7eb",
                  background: filters.importantOnly
                    ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                    : "#fff",
                  color: filters.importantOnly ? "#fff" : "#374151",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.3s ease",
                  boxShadow: filters.importantOnly
                    ? "0 2px 8px rgba(245,158,11,0.3)"
                    : "none",
                }}
              >
                <i
                  className={`bi ${filters.importantOnly ? "bi-star-fill" : "bi-star"}`}
                ></i>
                Important
                {importantCount > 0 && (
                  <span
                    style={{
                      background: filters.importantOnly
                        ? "rgba(255,255,255,0.3)"
                        : "#fef3c7",
                      color: filters.importantOnly ? "#fff" : "#92400e",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  >
                    {importantCount}
                  </span>
                )}
              </button>

              <button
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: "linear-gradient(135deg,#0891b2,#0e7490)",
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
                  <i className="bi bi-building"></i> Search (Firm Name or
                  Contact)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={filters.customerName}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="Search by firm name or contact number..."
                    style={{
                      width: "100%",
                      padding: "10px 40px 10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "14px",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0891b2";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
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
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>
              <div
                className="filter-group"
                style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setFilters((p) => ({ ...p, todayOnly: !p.todayOnly }))
                  }
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: filters.todayOnly
                      ? "2px solid #10b981"
                      : "1px solid #e5e7eb",
                    background: filters.todayOnly
                      ? "linear-gradient(135deg, #10b981, #059669)"
                      : "#fff",
                    color: filters.todayOnly ? "#fff" : "#374151",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i className="bi bi-calendar-day"></i> Today
                </button>

                {/* ✅ Important toggle inside filters too */}
                <button
                  type="button"
                  onClick={() =>
                    setFilters((p) => ({
                      ...p,
                      importantOnly: !p.importantOnly,
                    }))
                  }
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: filters.importantOnly
                      ? "2px solid #f59e0b"
                      : "1px solid #e5e7eb",
                    background: filters.importantOnly
                      ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                      : "#fff",
                    color: filters.importantOnly ? "#fff" : "#374151",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <i
                    className={`bi ${filters.importantOnly ? "bi-star-fill" : "bi-star"}`}
                  ></i>
                  Important Only
                </button>

                {/* Date Range */}
                <div className="filter-group">
                  <label className="filter-label">
                    <i className="bi bi-calendar-range"></i> Planned Date Range
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
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
                        outline: "none",
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
                        outline: "none",
                        color: "#000",
                      }}
                    />
                  </div>
                </div>

                {/* Follow Up Count Range */}
                <div className="filter-group">
                  <label className="filter-label">
                    <i className="bi bi-arrow-repeat"></i> Follow Up Count
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={filters.minFollowUp}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          minFollowUp: e.target.value,
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "14px",
                        outline: "none",
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
                      value={filters.maxFollowUp}
                      onChange={(e) =>
                        setFilters((p) => ({
                          ...p,
                          maxFollowUp: e.target.value,
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "14px",
                        outline: "none",
                        color: "#000",
                      }}
                    />
                  </div>
                </div>
              </div>
              {isAnyFilterActive && (
                <div className="filter-stats">
                  <span className="filter-stat-item">
                    <i className="bi bi-filter-circle"></i>Active:
                  </span>
                  {filters.importantOnly && (
                    <span
                      className="filter-tag"
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fcd34d",
                      }}
                    >
                      <i className="bi bi-star-fill"></i> Important Only
                    </span>
                  )}
                  <span className="filter-tag results">
                    Results: {sortedFilteredRows.length} of {rows.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
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
              <h3>Error</h3>
              <p>{error.message}</p>
              <button className="empty-clear-btn" onClick={() => refetch()}>
                <i className="bi bi-arrow-clockwise"></i>Retry
              </button>
            </div>
          ) : sortedFilteredRows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i
                  className={
                    filters.importantOnly ? "bi bi-star" : "bi bi-inbox"
                  }
                ></i>
              </div>
              <h3>
                {filters.importantOnly
                  ? "No Important Leads"
                  : "No Records Found"}
              </h3>
              <p>
                {filters.importantOnly
                  ? "Star ⭐ icon click करके leads को important mark करें"
                  : isAnyFilterActive
                    ? "No matches"
                    : "No pending broker calls"}
              </p>
              {isAnyFilterActive && (
                <button className="empty-clear-btn" onClick={clearFilters}>
                  <i className="bi bi-funnel"></i>Clear
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
                      {/* ✅ Star column */}
                      <th style={{ width: "50px" }}>
                        <div className="th-content">
                          <i
                            className="bi bi-star-fill"
                            style={{ color: "#fbbf24" }}
                          ></i>
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-hash"></i> Unique ID
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-building"></i> Firm Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-telephone"></i> Contact
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar"></i> Planned Date
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-arrow-repeat"></i> Follow Up
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
                    {sortedFilteredRows.map((r, i) => {
                      const marked = isImportant(r.uniqueId);
                      return (
                        <tr
                          key={`${r.rowIndex}`}
                          className={
                            isPlannedDateUrgent(getDisplayPlannedDate(r))
                              ? "urgent-visit-row"
                              : ""
                          }
                          style={{
                            backgroundColor: marked ? "#fffbeb" : "transparent",
                            borderLeft: marked
                              ? "3px solid #f59e0b"
                              : "3px solid transparent",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <td>
                            <span className="row-number">{i + 1}</span>
                          </td>

                          {/* ✅ Star Cell */}
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleImportant(r.uniqueId);
                              }}
                              title={
                                marked
                                  ? "Remove from Important"
                                  : "Mark as Important"
                              }
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "20px",
                                color: marked ? "#f59e0b" : "#d1d5db",
                                transition: "all 0.3s ease",
                                transform: marked ? "scale(1.2)" : "scale(1)",
                                filter: marked
                                  ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))"
                                  : "none",
                                padding: "4px",
                                lineHeight: "1",
                              }}
                              onMouseEnter={(e) => {
                                if (!marked) {
                                  e.target.style.color = "#fbbf24";
                                  e.target.style.transform = "scale(1.15)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!marked) {
                                  e.target.style.color = "#d1d5db";
                                  e.target.style.transform = "scale(1)";
                                }
                              }}
                            >
                              <i
                                className={`bi ${marked ? "bi-star-fill" : "bi-star"}`}
                              ></i>
                            </button>
                          </td>

                          <td>
                            <span
                              className="id-badge"
                              style={{
                                background:
                                  "linear-gradient(135deg,#e0f2fe,#bae6fd)",
                                color: "#0e7490",
                              }}
                            >
                              {r.uniqueId || "-"}
                            </span>
                          </td>
                          <td>
                            <span
                              className="customer-name"
                              style={{ fontWeight: "600" }}
                            >
                              {filters.customerName ? (
                                <HighlightText
                                  text={r.firmName || "-"}
                                  highlight={filters.customerName}
                                />
                              ) : (
                                r.firmName || "-"
                              )}
                              {/* ✅ Small star badge next to name if important */}
                              {marked && (
                                <span
                                  style={{
                                    marginLeft: "6px",
                                    fontSize: "9px",
                                    background:
                                      "linear-gradient(135deg, #fbbf24, #f59e0b)",
                                    color: "#fff",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontWeight: "700",
                                    letterSpacing: "0.5px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  <i
                                    className="bi bi-star-fill"
                                    style={{ fontSize: "8px" }}
                                  ></i>
                                  IMP
                                </span>
                              )}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`tel:${r.contact}`}
                              className="contact-link"
                            >
                              <i className="bi bi-telephone-fill"></i>
                              {filters.customerName ? (
                                <HighlightText
                                  text={String(r.contact || "-")}
                                  highlight={filters.customerName}
                                />
                              ) : (
                                r.contact || "-"
                              )}
                            </a>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "inline-flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: "4px",
                              }}
                            >
                              <span
                                className={`planned-badge ${isPlannedDateUrgent(getDisplayPlannedDate(r)) ? "urgent-badge" : ""}`}
                                style={{
                                  background: isPlannedDateUrgent(
                                    getDisplayPlannedDate(r),
                                  )
                                    ? "#fef2f2"
                                    : r.nextFollowUpDate
                                      ? "#f5f3ff"
                                      : "#e0f2fe",
                                  color: isPlannedDateUrgent(
                                    getDisplayPlannedDate(r),
                                  )
                                    ? "#dc2626"
                                    : r.nextFollowUpDate
                                      ? "#6b21a8"
                                      : "#0e7490",
                                  border: `1px solid ${
                                    isPlannedDateUrgent(
                                      getDisplayPlannedDate(r),
                                    )
                                      ? "#fca5a5"
                                      : r.nextFollowUpDate
                                        ? "#d8b4fe"
                                        : "#7dd3fc"
                                  }`,
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <i className="bi bi-calendar-event"></i>
                                {getDisplayPlannedDate(r) || "-"}
                                {r.nextFollowUpDate && (
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      background: "#8b5cf6",
                                      color: "#fff",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      fontWeight: "700",
                                      letterSpacing: "0.5px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                      marginLeft: "4px",
                                    }}
                                    title={`Original Planned: ${r.plannedDate}\nRescheduled via Call Again`}
                                  >
                                    <i
                                      className="bi bi-arrow-repeat"
                                      style={{ fontSize: "10px" }}
                                    ></i>
                                    RESCHEDULED
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                background:
                                  r.followUpCounter >= 5
                                    ? "#ef4444"
                                    : r.followUpCounter >= 3
                                      ? "#f59e0b"
                                      : "#10b981",
                                color: "white",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontWeight: "bold",
                                minWidth: "32px",
                                textAlign: "center",
                                display: "inline-block",
                              }}
                            >
                              {r.followUpCounter || 0}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button
                              className="action-btn"
                              onClick={() => handleAction(r)}
                              style={{
                                background:
                                  "linear-gradient(135deg,#0891b2,#0e7490)",
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
              <div className="table-footer">
                <div className="footer-info">
                  <i
                    className="bi bi-info-circle"
                    style={{ color: "#0891b2" }}
                  ></i>
                  Showing <strong>{sortedFilteredRows.length}</strong> of{" "}
                  <strong>{rows.length}</strong> records
                  {importantCount > 0 && (
                    <span
                      style={{
                        marginLeft: "12px",
                        color: "#f59e0b",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <i className="bi bi-star-fill"></i>
                      {importantCount} Important
                    </span>
                  )}
                </div>
                <div className="footer-actions">
                  {isAnyFilterActive && (
                    <button
                      className="clear-filter-btn"
                      onClick={clearFilters}
                      style={{
                        background: "linear-gradient(135deg,#ef4444,#dc2626)",
                      }}
                    >
                      <i className="bi bi-x-circle"></i>Clear
                    </button>
                  )}
                  <button className="refresh-btn" onClick={() => refetch()}>
                    <i className="bi bi-arrow-clockwise"></i>Refresh
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ===================== MODAL ===================== */}
        {showModal && selectedLead && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-header-custom"
                style={{
                  background: "linear-gradient(135deg,#0891b2,#0e7490)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-telephone-inbound-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>
                      Update Call to Broker
                      {/* ✅ Star toggle in modal header */}
                      <button
                        type="button"
                        onClick={() => toggleImportant(selectedLead.uniqueId)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "22px",
                          color: isImportant(selectedLead.uniqueId)
                            ? "#fbbf24"
                            : "rgba(255,255,255,0.5)",
                          marginLeft: "10px",
                          verticalAlign: "middle",
                          transition: "all 0.3s ease",
                          filter: isImportant(selectedLead.uniqueId)
                            ? "drop-shadow(0 0 6px rgba(251,191,36,0.7))"
                            : "none",
                        }}
                        title={
                          isImportant(selectedLead.uniqueId)
                            ? "Remove from Important"
                            : "Mark as Important"
                        }
                      >
                        <i
                          className={`bi ${isImportant(selectedLead.uniqueId) ? "bi-star-fill" : "bi-star"}`}
                        ></i>
                      </button>
                    </h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge">
                        <i className="bi bi-hash"></i>
                        {selectedLead.uniqueId}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-building"></i>
                        {selectedLead.firmName}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-telephone"></i>
                        {selectedLead.contact}
                      </span>
                      {isImportant(selectedLead.uniqueId) && (
                        <span
                          style={{
                            background:
                              "linear-gradient(135deg, #fbbf24, #f59e0b)",
                            color: "#fff",
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <i className="bi bi-star-fill"></i> Important
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body-custom">
                <form onSubmit={handleSubmit}>
                  {/* Status */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-tag-fill"
                        style={{ color: "#0891b2" }}
                      ></i>
                      Status <span className="required">*</span>
                    </label>
                    <div
                      className="status-grid"
                      style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                    >
                      {statusOptions.map((o) => (
                        <div
                          key={o.value}
                          className={`status-option ${formData.status === o.value ? "active" : ""}`}
                          style={{ "--option-color": o.color }}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              status: o.value,
                              nextFollowUpDate: "",
                              meetingDate: "",
                            })
                          }
                        >
                          <i className={`bi ${o.icon}`}></i>
                          <span>{o.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Call Again — Next Follow Up Date */}
                  {formData.status === "Call Again" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#8b5cf6" }}
                        ></i>
                        Next Follow-Up Date <span className="required">*</span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#ef4444",
                            marginLeft: "8px",
                            fontWeight: "normal",
                          }}
                        >
                          (Max 6:00 PM)
                        </span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="datetime-local"
                          className="form-input-custom"
                          value={formData.nextFollowUpDate}
                          onChange={(e) =>
                            handleDateTimeChange(
                              "nextFollowUpDate",
                              e.target.value,
                            )
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", background: "#fff" }}
                        />
                      </div>
                      {formData.nextFollowUpDate && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#8b5cf6",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>
                          Selected:{" "}
                          {new Date(formData.nextFollowUpDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Agreed to Meeting — Meeting Date */}
                  {formData.status === "Agreed to next meeting" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-event-fill"
                          style={{ color: "#10b981" }}
                        ></i>
                        Meeting Date <span className="required">*</span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#ef4444",
                            marginLeft: "8px",
                            fontWeight: "normal",
                          }}
                        >
                          (Max 6:00 PM)
                        </span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="datetime-local"
                          className="form-input-custom"
                          value={formData.meetingDate}
                          onChange={(e) =>
                            handleDateTimeChange("meetingDate", e.target.value)
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", background: "#fff" }}
                        />
                      </div>
                      {formData.meetingDate && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#10b981",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>
                          Selected:{" "}
                          {new Date(formData.meetingDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* No Connection Info Block */}
                  {formData.status === "No Connection" &&
                    (() => {
                      const future = new Date(
                        Date.now() + 15 * 24 * 60 * 60 * 1000,
                      );
                      let isShifted = false;
                      if (future.getDay() === 0) {
                        future.setDate(future.getDate() + 1);
                        isShifted = true;
                      }

                      return (
                        <div
                          className="form-section"
                          style={{
                            animation: "fadeIn 0.3s",
                            background: "rgba(14,165,233,0.05)",
                            borderColor: "rgba(14,165,233,0.2)",
                            padding: "15px",
                            borderRadius: "10px",
                            border: "1px solid rgba(14,165,233,0.2)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              color: "#0ea5e9",
                              fontWeight: "600",
                              fontSize: "14px",
                            }}
                          >
                            <i className="bi bi-wifi-off"></i>
                            Next call will be scheduled after 15 days
                            automatically
                          </div>
                          <div
                            style={{
                              marginTop: "8px",
                              fontSize: "13px",
                              color: "#6b7280",
                            }}
                          >
                            Date:{" "}
                            <strong>
                              {future.toLocaleDateString("en-IN", {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </strong>{" "}
                            at 10:00 AM
                          </div>
                          {isShifted && (
                            <div
                              style={{
                                marginTop: "6px",
                                fontSize: "11px",
                                color: "#f59e0b",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: "600",
                              }}
                            >
                              <i className="bi bi-info-circle-fill"></i>
                              Shifted from Sunday → Monday (weekend skip)
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* Contact Person Name */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-person-fill"
                        style={{ color: "#6366f1" }}
                      ></i>
                      Contact Person Name
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        className="form-input-custom"
                        placeholder="Enter contact person name..."
                        value={formData.contactPersonName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactPersonName: e.target.value,
                          })
                        }
                        style={{ color: "#000", border: "1px solid #000" }}
                      />
                    </div>
                  </div>

                  {/* Is Lead Qualified + RERA */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                    }}
                  >
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-check-circle-fill"
                          style={{ color: "#10b981" }}
                        ></i>
                        Is Lead Qualified
                      </label>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "5px",
                        }}
                      >
                        {["Yes", "No"].map((val) => {
                          const isSelected = formData.isLeadQualified === val;

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  isLeadQualified: isSelected ? "" : val,
                                })
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: isSelected
                                  ? `1px solid ${
                                      val === "Yes" ? "#10b981" : "#ef4444"
                                    }`
                                  : "1px solid #e5e7eb",
                                backgroundColor: isSelected
                                  ? val === "Yes"
                                    ? "#d1fae5"
                                    : "#fee2e2"
                                  : "#fff",
                                color: isSelected
                                  ? val === "Yes"
                                    ? "#065f46"
                                    : "#991b1b"
                                  : "#374151",
                                fontWeight: "500",
                                outline: "none",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                style={{
                                  accentColor:
                                    val === "Yes" ? "#10b981" : "#ef4444",
                                  cursor: "pointer",
                                }}
                              />
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-card-checklist"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        RERA Registered
                      </label>
                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          marginTop: "5px",
                        }}
                      >
                        {["Yes", "No"].map((val) => {
                          const isSelected = formData.rera === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  rera: isSelected ? "" : val,
                                })
                              }
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: isSelected
                                  ? `1px solid ${val === "Yes" ? "#10b981" : "#ef4444"}`
                                  : "1px solid #e5e7eb",
                                backgroundColor: isSelected
                                  ? val === "Yes"
                                    ? "#d1fae5"
                                    : "#fee2e2"
                                  : "#fff",
                                color: isSelected
                                  ? val === "Yes"
                                    ? "#065f46"
                                    : "#991b1b"
                                  : "#374151",
                                fontWeight: "500",
                                outline: "none",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                style={{
                                  accentColor:
                                    val === "Yes" ? "#10b981" : "#ef4444",
                                  cursor: "pointer",
                                }}
                              />
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Previous Remarks */}
                  {selectedLead.remark && (
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
                        {selectedLead.remark}
                      </div>
                    </div>
                  )}

                  {/* New Remarks */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-square-text-fill"
                        style={{ color: "#0891b2" }}
                      ></i>
                      New Remarks
                    </label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea-custom"
                        placeholder="Add remarks..."
                        value={formData.remarks}
                        onChange={(e) =>
                          setFormData({ ...formData, remarks: e.target.value })
                        }
                        rows={3}
                        style={{
                          color: "#000",
                          borderLeft: "3px solid #0891b2",
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
                  disabled={updateMutation.isPending || !formData.status}
                  style={{
                    background:
                      formData.status === "Agreed to next meeting"
                        ? "linear-gradient(135deg,#10b981,#059669)"
                        : formData.status === "Not interested"
                          ? "linear-gradient(135deg,#ef4444,#dc2626)"
                          : formData.status === "No Connection"
                            ? "linear-gradient(135deg,#0ea5e9,#0284c7)"
                            : "linear-gradient(135deg,#0891b2,#0e7490)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>Updating...
                    </>
                  ) : formData.status === "Call Again" ? (
                    <>
                      <i className="bi bi-telephone-forward"></i> Schedule
                      Follow-Up
                    </>
                  ) : formData.status === "Agreed to next meeting" ? (
                    <>
                      <i className="bi bi-calendar-check"></i> Schedule Meeting
                    </>
                  ) : formData.status === "No Connection" ? (
                    <>
                      <i className="bi bi-wifi-off"></i> Mark No Connection
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i> Submit
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
      {parts.map((p, i) =>
        regex.test(p) ? (
          <mark
            key={i}
            style={{
              backgroundColor: "#e0f2fe",
              color: "#0e7490",
              padding: "0 2px",
              borderRadius: "2px",
            }}
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </span>
  );
};

export default CallToBroker;
