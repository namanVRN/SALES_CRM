import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fetchMeetingNbdData, updateMeetingNbdLead } from "../services/NbdApi";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import { toast } from "react-toastify";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

function MeetingNbd() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();
  const highlightLeadId = location.state?.highlightLeadId || null;
  const fromSearch = location.state?.fromSearch || false;

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    rescheduleDate: "",
    nextFieldVisitDate: "",
    remarks: "",
    notInterestedReason: "",
  });

  // ✅ Change 1: Updated filter state with followUpCount and todayOnly
  const [filters, setFilters] = useState({
    plannedDateFrom: "",
    plannedDateTo: "",
    customerName: "",
    followUpCount: "all",
    todayOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["meetingNbd"],
    queryFn: fetchMeetingNbdData,
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
  });

  const isPlannedDateUrgent = (plannedDateStr) => {
    if (!plannedDateStr) return false;
    const parts = plannedDateStr.split("/");
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    const pd = new Date(year, month - 1, day);
    pd.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pd <= today;
  };

  // ✅ Change 2: Updated filteredRows with FollowUp Count and Today filter
  const filteredRows = rows.filter((row) => {
    if (filters.customerName) {
      if (
        !(row.customerName?.toLowerCase() || "").includes(
          filters.customerName.toLowerCase().trim(),
        )
      )
        return false;
    }

    // FollowUp Count filter - Exact match
    if (filters.followUpCount !== "all") {
      const count = parseInt(row.followUpCount || row.followupCount || 0);
      if (filters.followUpCount === "0" && count !== 0) return false;
      if (filters.followUpCount === "1" && count !== 1) return false;
      if (filters.followUpCount === "2" && count !== 2) return false;
      if (filters.followUpCount === "3" && count !== 3) return false;
      if (filters.followUpCount === "4" && count !== 4) return false;
      if (filters.followUpCount === "5+" && count < 5) return false;
    }

    // Today filter
    if (filters.todayOnly) {
      const pd = row.plannedDate;
      if (!pd) return false;
      const parts = pd.split("/");
      if (parts.length !== 3) return false;
      const planned = new Date(
        parseInt(parts[2], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[0], 10),
      );
      planned.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (planned.getTime() !== today.getTime()) return false;
    }

    if (!filters.plannedDateFrom && !filters.plannedDateTo) return true;
    const pd = row.plannedDate;
    if (!pd) return false;
    const parseD = (ds) => {
      if (!ds) return null;
      const p = ds.split("/");
      if (p.length !== 3) return null;
      return new Date(
        parseInt(p[2], 10),
        parseInt(p[1], 10) - 1,
        parseInt(p[0], 10),
      );
    };
    const rd = parseD(pd);
    if (!rd) return false;
    const norm = (d) => {
      const n = new Date(d);
      n.setHours(0, 0, 0, 0);
      return n;
    };
    const nr = norm(rd);
    if (filters.plannedDateFrom && nr < norm(new Date(filters.plannedDateFrom)))
      return false;
    if (filters.plannedDateTo && nr > norm(new Date(filters.plannedDateTo)))
      return false;
    return true;
  });

  // ✅ Change 3: Updated isAnyFilterActive
  const isAnyFilterActive =
    filters.plannedDateFrom ||
    filters.plannedDateTo ||
    filters.customerName ||
    filters.followUpCount !== "all" ||
    filters.todayOnly;

  const getMinDateTime = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };
  const isDateTimeInPast = (v) => {
    if (!v) return false;
    return new Date(v) < new Date();
  };
  const isTimeAfter6PM = (v) => {
    if (!v) return false;
    return new Date(v).getHours() >= 18;
  };
  const handleDateTimeChange = (field, value) => {
    if (isDateTimeInPast(value)) {
      toast.warning("⚠️ Past date और time select नहीं कर सकते!");
      return;
    }
    if (isTimeAfter6PM(value)) {
      toast.warning("⏰ 6 PM के बाद का time select नहीं कर सकते!");
      const date = new Date(value);
      date.setHours(18, 0, 0, 0);
      setFormData({ ...formData, [field]: date.toISOString().slice(0, 16) });
      return;
    }
    setFormData({ ...formData, [field]: value });
  };

  const updateMutation = useMutation({
    mutationFn: updateMeetingNbdLead,
    onSuccess: () => {
      toast.success("Meeting updated successfully!");
      queryClient.invalidateQueries(["meetingNbd"]);
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(
        "Error: " + (error?.response?.data?.message || error.message),
      );
    },
  });

  // ✅ Change 6: Helper function for FSR name
  const getFSRName = (fsrDoer) => {
    if (fsrDoer === "BDM4") return "Ranjeet Gour";
    if (fsrDoer === "BDM5") return "Amit Rohar";
    if (fsrDoer === "Varun Sir") return "Varun Sir";
    if (fsrDoer === "BDM8") return "Ayush Dixit";
    if (fsrDoer === "BDM9") return "Rohit Kumar";
    return fsrDoer || "-";
  };

  const isAdmin = user?.role === "admin" || user?.assignedModule === "all";

  const handleActionClick = (lead) => {
    setSelectedLead(lead);
    setFormData({
      status: "",
      rescheduleDate: "",
      nextFieldVisitDate: "",
      remarks: "",
      notInterestedReason: "",
    });
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      status: "",
      rescheduleDate: "",
      nextFieldVisitDate: "",
      remarks: "",
      notInterestedReason: "",
    });
  };

  const formatToSheetDateTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  const cleanDateTime = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split(" ");
    return parts.length > 2 ? `${parts[0]} ${parts[1]}` : dateStr;
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
      formData.status === "Next Field Visit Required" &&
      !formData.nextFieldVisitDate
    ) {
      toast.warning("Please select Next Field Visit Date");
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

    if (formData.rescheduleDate && isDateTimeInPast(formData.rescheduleDate)) {
      toast.error("Reschedule Date past date/time नहीं हो सकता!");
      return;
    }
    if (
      formData.nextFieldVisitDate &&
      isDateTimeInPast(formData.nextFieldVisitDate)
    ) {
      toast.error("Next Field Visit Date past date/time नहीं हो सकता!");
      return;
    }
    if (formData.rescheduleDate && isTimeAfter6PM(formData.rescheduleDate)) {
      toast.error("Reschedule Date में 6 PM के बाद का time नहीं हो सकता!");
      return;
    }
    if (
      formData.nextFieldVisitDate &&
      isTimeAfter6PM(formData.nextFieldVisitDate)
    ) {
      toast.error(
        "Next Field Visit Date में 6 PM के बाद का time नहीं हो सकता!",
      );
      return;
    }

    if (
      ["Not Interested", "Negotiation Failed", "Deal Not Done"].includes(
        formData.status,
      ) &&
      !formData.notInterestedReason?.trim()
    ) {
      toast.error(`${formData.status} का reason देना ज़रूरी है!`);
      return;
    }

    const frd = formatToSheetDateTime(formData.rescheduleDate);
    const ffvd = formatToSheetDateTime(formData.nextFieldVisitDate);
    updateMutation.mutate({
      sheetName: selectedLead.sheetName,
      rowIndex: selectedLead.rowIndex,
      status: formData.status,
      rescheduleDate: frd ? cleanDateTime(frd) : undefined,
      nextFieldVisitDate: ffvd ? cleanDateTime(ffvd) : undefined,
      remarks: formData.remarks?.trim() || "",
      notInterestedReason: formData.notInterestedReason?.trim() || "",
      leadInfo: {
        uniqueId: selectedLead.uniqueId,
        customerName: selectedLead.customerName,
        customerContact: selectedLead.customerContact,
        interestedIn: selectedLead.interestedIn,
        projectSelection: selectedLead.projectSelection,
        leadSource: selectedLead.leadSource || "",
        doer: selectedLead.doer || "",
      },
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  // ✅ Change 4: Updated clearFilters
  const clearFilters = () => {
    setFilters({
      plannedDateFrom: "",
      plannedDateTo: "",
      customerName: "",
      followUpCount: "all",
      todayOnly: false,
    });
  };

  const getLeadSourceBadge = (source) => {
    if (!source) return <span className="source-tag">-</span>;
    const s = source.toLowerCase();
    if (s.includes("channel") || s.includes("partner") || s.includes("cp"))
      return <span className="source-tag channel">{source}</span>;
    return <span className="source-tag direct">{source}</span>;
  };
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending" || s === "")
      return <span className="status-tag pending">Pending</span>;
    if (s === "reschedule")
      return <span className="status-tag call-again">Reschedule</span>;
    if (s === "done") return <span className="status-tag done">Done</span>;
    if (s === "next field visit required")
      return (
        <span
          className="status-tag"
          style={{
            background: "#fef3c7",
            color: "#b45309",
            border: "1px solid #fcd34d",
          }}
        >
          Next Field Visit
        </span>
      );
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
      value: "Next Field Visit Required",
      label: "Next Field Visit Required",
      icon: "bi-geo-alt-fill",
      color: "#f59e0b",
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

  useEffect(() => {
    if (highlightLeadId && fromSearch && rows.length > 0) {
      // Wait for DOM to render
      setTimeout(() => {
        const targetRow = document.querySelector(
          `[data-lead-id="${highlightLeadId}"]`,
        );
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
          targetRow.classList.add("search-highlight-row");
          setTimeout(() => {
            targetRow.classList.remove("search-highlight-row");
          }, 3000);
        }
      }, 500);
    }
  }, [rows, highlightLeadId, fromSearch]);

  return (
    <Layout
      breadcrumbs={[
        { name: "NBD IN", path: "/nbd-in" },
        { name: "Meeting", path: "/nbd-in/meeting" },
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
              <h1>Meeting</h1>
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

        {/* Filters */}
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
                  <i className="bi bi-x-circle"></i>Clear Filters
                </button>
              )}
            </div>
          </div>
          {showFilters && (
            <div className="filter-form">
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-person-search"></i>Customer Name
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

              {/* ✅ Change 5: Added Follow-up dropdown and Today button */}
              <div
                className="filter-group"
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <label className="filter-label">
                    <i className="bi bi-arrow-repeat"></i> Follow-ups
                  </label>
                  <select
                    value={filters.followUpCount}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        followUpCount: e.target.value,
                      }))
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "14px",
                      outline: "none",
                      minWidth: "100px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="all">All</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>

                <div>
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
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "#fff",
                      color: filters.todayOnly ? "#fff" : "#374151",
                      fontWeight: "600",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <i className="bi bi-calendar-day"></i>
                    Today
                  </button>
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-calendar-range"></i>Planned Date Range
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
                    <i className="bi bi-filter-circle"></i>Active Filters:
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
              <h3>Please Refresh the page or try logout and login again</h3>
              <p>{error.message}</p>
              <button className="empty-clear-btn" onClick={() => refetch()}>
                <i className="bi bi-arrow-clockwise"></i>Try Again (Refresh the
                page)
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
                  <i className="bi bi-funnel"></i>Clear Filters
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
                      {/* ✅ Change 7: Handled By column for admin */}
                      {isAdmin && (
                        <th>
                          <div className="th-content">
                            <i className="bi bi-person-check"></i> Handled By
                          </div>
                        </th>
                      )}
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
                          <i className="bi bi-geo-alt-fill"></i>Field Visits
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
                    {filteredRows.map((r, i) => {
                      return (
                        <tr
                          key={i}
                          data-lead-id={r.uniqueId} // ✅ NEW
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
                          {/* ✅ Change 8: Handled By data cell for admin */}
                          {isAdmin && (
                            <td>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  background:
                                    r.fsrDoer === "BDM4"
                                      ? "#fff7ed"
                                      : r.fsrDoer === "BDM5"
                                        ? "#f5f3ff"
                                        : "#f3f4f6",
                                  color:
                                    r.fsrDoer === "BDM4"
                                      ? "#9a3412"
                                      : r.fsrDoer === "BDM5"
                                        ? "#5b21b6"
                                        : "#374151",
                                  border: `1px solid ${r.fsrDoer === "BDM4" ? "#fdba74" : r.fsrDoer === "BDM5" ? "#c4b5fd" : "#d1d5db"}`,
                                }}
                              >
                                {getFSRName(r.fsrDoer)}
                              </span>
                            </td>
                          )}
                          <td>{getStatusBadge(r.status)}</td>
                          <td>
                            <span
                              className={`planned-badge purple ${isPlannedDateUrgent(r.plannedDate) ? "urgent-badge" : ""}`}
                            >
                              <i className="bi bi-calendar-event"></i>
                              {r.plannedDate || "-"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className="badge rounded-pill"
                              style={{
                                background:
                                  r.fieldVisitCount > 0
                                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                    : "#f3f4f6",
                                color:
                                  r.fieldVisitCount > 0 ? "#fff" : "#9ca3af",
                                border:
                                  r.fieldVisitCount > 0
                                    ? "none"
                                    : "1px solid #d1d5db",
                                fontWeight:
                                  r.fieldVisitCount > 0 ? "600" : "normal",
                                padding: "5px 12px",
                                fontSize: "0.85rem",
                              }}
                            >
                              <i
                                className="bi bi-geo-alt-fill"
                                style={{
                                  marginRight: "4px",
                                  fontSize: "0.75rem",
                                }}
                              ></i>
                              {r.fieldVisitCount || 0}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
                      <i className="bi bi-x-circle"></i>Clear Filter
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

              <div className="modal-body-custom">
                <div className="lead-info-card">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi bi-telephone"></i>Contact
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
                        <i className="bi bi-calendar"></i>Planned Date
                      </span>
                      <span className="info-value">
                        <span className="planned-tag purple">
                          {selectedLead.plannedDate}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi bi-building"></i>Project
                      </span>
                      <span className="info-value">
                        {selectedLead.projectSelection || "-"}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">
                        <i className="bi bi-heart"></i>Interested In
                      </span>
                      <span className="info-value">
                        {selectedLead.interestedIn || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
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
                      {statusOptions.map((opt) => (
                        <div
                          key={opt.value}
                          className={`status-option ${formData.status === opt.value ? "active" : ""}`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              status: opt.value,
                              rescheduleDate: "",
                              nextFieldVisitDate: "",
                              notInterestedReason: "",
                            })
                          }
                          style={{ "--option-color": opt.color }}
                        >
                          <i className={`bi ${opt.icon}`}></i>
                          <span>{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {[
                    "Not Interested",
                    "Negotiation Failed",
                    "Deal Not Done",
                  ].includes(formData.status) && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s ease-in-out" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-exclamation-triangle-fill"
                          style={{ color: "#ef4444" }}
                        ></i>
                        Reason for {formData.status}{" "}
                        <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <textarea
                          className="form-input-custom"
                          rows="2"
                          placeholder={`${formData.status} का reason लिखें...`}
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
                            borderLeft: "3px solid #ef4444",
                          }}
                        ></textarea>
                      </div>
                    </div>
                  )}

                  {formData.status === "Reschedule" && (
                    <div
                      className="form-section meeting-date-section"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(236,72,153,0.05) 0%, rgba(236,72,153,0.05) 100%)",
                        borderColor: "rgba(236,72,153,0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#ec4899" }}
                        ></i>
                        Reschedule Date <span className="required">*</span>
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
                          value={formData.rescheduleDate}
                          onChange={(e) =>
                            handleDateTimeChange(
                              "rescheduleDate",
                              e.target.value,
                            )
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", backgroundColor: "#fff" }}
                        />
                      </div>
                      {formData.rescheduleDate && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#ec4899",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>Selected:{" "}
                          {new Date(formData.rescheduleDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.status === "Next Field Visit Required" && (
                    <div
                      className="form-section meeting-date-section"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.05) 100%)",
                        borderColor: "rgba(245,158,11,0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-geo-alt-fill"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        Next Field Visit Date{" "}
                        <span className="required">*</span>
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
                          value={formData.nextFieldVisitDate}
                          onChange={(e) =>
                            handleDateTimeChange(
                              "nextFieldVisitDate",
                              e.target.value,
                            )
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", backgroundColor: "#fff" }}
                        />
                      </div>
                      {formData.nextFieldVisitDate && (
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
                          {new Date(formData.nextFieldVisitDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedLead.oldRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-clock-history"
                          style={{ color: "#6b7280" }}
                        ></i>
                        Initial Remarks{" "}
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

                  {selectedLead.previousRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-left-text"
                          style={{ color: "#ec4899" }}
                        ></i>
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

                  {selectedLead.latestOldRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-square-dots"
                          style={{ color: "#3b82f6" }}
                        ></i>
                        Latest Old Remarks{" "}
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

                  {selectedLead.recentRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-dots"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        Recent Remarks{" "}
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

                  {selectedLead.remarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-left-text"
                          style={{ color: "#8b5cf6" }}
                        ></i>
                        Current Remarks{" "}
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
                        {selectedLead.remarks}
                      </div>
                    </div>
                  )}

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
                            : formData.status === "Next Field Visit Required"
                              ? "Details about next field visit..."
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
                        style={{ borderLeft: "3px solid #8b5cf6" }}
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
                  <i className="bi bi-x-circle"></i>Cancel
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
                      <div className="spinner"></div>Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i>Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>
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

export default MeetingNbd;
