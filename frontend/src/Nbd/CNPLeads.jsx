import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  fetchCNPData,
  updateCNPLead,
  assignNBDINLead,
} from "../services/NbdApi.js";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import WhatsAppModal from "../components/WhatsAppModal";
import { toast } from "react-toastify";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

function CNPLeads() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isFSRUser = user?.assignedModule === "fsr";
  const location = useLocation();
  const highlightLeadId = location.state?.highlightLeadId || null;
  const fromSearch = location.state?.fromSearch || false;

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [formData, setFormData] = useState({
    remarks: "",
    fieldVisitDate: "",
    nextFollowUpDate: "",
    notInterestedReason: "",
  });

  const [waLead, setWaLead] = useState(null);

  const [filters, setFilters] = useState({
    plannedDateFrom: "",
    plannedDateTo: "",
    customerName: "",
    followUpCount: "all",
    todayOnly: false,
    bdmFilter: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cnpLeads"],
    queryFn: fetchCNPData,
    select: (res) => res?.data || [],
      staleTime: 1000 * 30,        // ✅ 30 seconds only
  refetchOnWindowFocus: true,   // ✅ Refresh when user comes back to tab
  refetchInterval: 1000 * 60,   // ✅ Auto-refresh every 1 minute

  });

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

  const filteredRows = rows.filter((row) => {
    if (filters.customerName) {
      const searchTerm = filters.customerName.toLowerCase().trim();
      const nameMatch = (row.customerName?.toLowerCase() || "").includes(
        searchTerm,
      );
      const contactMatch = (row.customerContact?.toString() || "").includes(
        searchTerm,
      );
      if (!nameMatch && !contactMatch) return false;
    }
    if (filters.bdmFilter !== "all" && (row.doer || "") !== filters.bdmFilter)
      return false;
    if (filters.followUpCount !== "all") {
      const count = parseInt(row.followupCount || row.followUpCount || 0);
      if (filters.followUpCount === "5+" && count < 5) return false;
      else if (
        filters.followUpCount !== "5+" &&
        count !== parseInt(filters.followUpCount)
      )
        return false;
    }
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
    if (!row.plannedDate) return false;
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
    const rd = parseD(row.plannedDate);
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

  const isAnyFilterActive =
    filters.plannedDateFrom ||
    filters.plannedDateTo ||
    filters.customerName ||
    filters.followUpCount !== "all" ||
    filters.todayOnly ||
    filters.bdmFilter !== "all";

  const getMinDateTime = () => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}T${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
  };

  const isDateTimeInPast = (v) => (v ? new Date(v) < new Date() : false);

  const isTimeAfter6PM = (v) => (v ? new Date(v).getHours() >= 19 : false);

  const handleDateTimeChange = (field, value) => {
    if (isDateTimeInPast(value)) {
      toast.warning("⚠️ Past date और time select नहीं कर सकते!");
      return;
    }

    if (isTimeAfter6PM(value)) {
      toast.warning("⏰ 7 PM के बाद का time select नहीं कर सकते!");
      const d = new Date(value);
      d.setHours(19, 0, 0, 0);

      setFormData({
        ...formData,
        [field]: d.toISOString().slice(0, 16),
      });
      return;
    }

    setFormData({ ...formData, [field]: value });
  };

  const updateMutation = useMutation({
    mutationFn: updateCNPLead,
    onSuccess: (d) => {
      toast.success(d.message || "Updated!");
      queryClient.invalidateQueries(["cnpLeads"]);
      queryClient.invalidateQueries(["fieldVisit"]);
      handleCloseModal();
    },
    onError: (e) => {
      toast.error(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to update",
      );
    },
  });

  // ✅ Assign Doer mutation
  const assignMutation = useMutation({
    mutationFn: assignNBDINLead,
    onSuccess: (d) => {
      toast.success(d.message || "Assigned");
      queryClient.invalidateQueries(["cnpLeads"]);
      setAssigningLeadId(null);
    },
    onError: (e) => {
      toast.error("❌ " + (e?.response?.data?.error || e?.message || "Failed"));
      setAssigningLeadId(null);
    },
  });

  const handleAssignChange = (lead, v) => {
    if (lead.doer === v) return;
    setAssigningLeadId(lead.uniqueId);
    assignMutation.mutate({ uniqueId: lead.uniqueId, assignTo: v });
  };

  const handleAction = (lead) => {
    setSelectedLead(lead);
    setActionType(null);
    setFormData({
      remarks: "",
      fieldVisitDate: "",
      nextFollowUpDate: "",
      notInterestedReason: "",
    });
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setActionType(null);
    setFormData({
      remarks: "",
      fieldVisitDate: "",
      nextFollowUpDate: "",
      notInterestedReason: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!actionType) {
      toast.error("Please select an action!");
      return;
    }

    const payload = {
      rowIndex: selectedLead.rowIndex,
      action: actionType,
      remarks: formData.remarks,
      leadInfo: {
        uniqueId: selectedLead.uniqueId,
        customerName: selectedLead.customerName,
        customerContact: selectedLead.customerContact,
        interestedIn: selectedLead.interestedIn,
        projectSelection: selectedLead.projectSelection,
        leadSource: selectedLead.leadSource || "",
        doer: selectedLead.doer || "",
      },
    };

    if (actionType === "schedule") {
      if (!formData.fieldVisitDate) {
        toast.error("Field Visit Date select करें!");
        return;
      }
      if (isDateTimeInPast(formData.fieldVisitDate)) {
        toast.error("Past date select नहीं कर सकते!");
        return;
      }
      if (isTimeAfter6PM(formData.fieldVisitDate)) {
        toast.error("6 PM के बाद का time नहीं!");
        return;
      }
      payload.fieldVisitDate = formData.fieldVisitDate;
    } else if (actionType === "not-interested") {
      if (!formData.notInterestedReason.trim()) {
        toast.error("Not Interested का reason देना ज़रूरी है!");
        return;
      }
      payload.notInterestedReason = formData.notInterestedReason.trim();
    } else if (actionType === "cnp-again") {
      if (!formData.nextFollowUpDate) {
        toast.error("Next Follow-Up Date select करें!");
        return;
      }
      if (isDateTimeInPast(formData.nextFollowUpDate)) {
        toast.error("Past date select नहीं कर सकते!");
        return;
      }
      if (isTimeAfter6PM(formData.nextFollowUpDate)) {
        toast.error("6 PM के बाद का time नहीं!");
        return;
      }
      payload.nextFollowUpDate = formData.nextFollowUpDate;
    } else if (actionType === "next-followup") {
      if (!formData.nextFollowUpDate) {
        toast.error("Next Follow-Up Date select करें!");
        return;
      }
      if (isDateTimeInPast(formData.nextFollowUpDate)) {
        toast.error("Past date select नहीं कर सकते!");
        return;
      }
      if (isTimeAfter6PM(formData.nextFollowUpDate)) {
        toast.error("6 PM के बाद का time नहीं!");
        return;
      }
      payload.nextFollowUpDate = formData.nextFollowUpDate;
    }

    updateMutation.mutate(payload);
  };

  const handleFilterChange = (e) => {
    setFilters((p) => ({ ...p, [e.target.name]: e.target.value }));
  };
  const clearFilters = () =>
    setFilters({
      plannedDateFrom: "",
      plannedDateTo: "",
      customerName: "",
      followUpCount: "all",
      todayOnly: false,
      bdmFilter: "all",
    });

    const getSourceBadge = (s) => {
  const l = s?.toLowerCase() || "";
  if (l.includes("channel") || l.includes("partner") || l.includes("cp"))
    return <span className="source-tag channel">Channel Partner</span>;
  else if (
    l.includes("Social Media".toLowerCase()) ||
    l.includes("social".toLowerCase()) ||
    l.includes("media".toLowerCase())
  )
    return <span className="source-tag social">Social Media</span>;
  return <span className="source-tag direct">Direct</span>;
};

  const getDoerBadgeColor = (d) => {
    if (d === "BDM1")
      return { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" };
    if (d === "BDM2")
      return { bg: "#fce7f3", color: "#9d174d", border: "#f9a8d4" };
    if (d === "BDM6")
      return { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" };
    if (d === "Varun Sir")
      return { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" };
    if (d === "Mohan Sir")
      return { bg: "#e0e7ff", color: "#3730a3", border: "#a5b4fc" };
    return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  };

  return (
    <Layout
      breadcrumbs={[
        { name: "NBD IN", path: "/nbd-in" },
        { name: "Call Not Picked", path: "/nbd-in/cnp" },
      ]}
    >
      <div className="table-page-container">
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg,#0891b2,#0e7490)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
          ></div>
        </div>
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg,#0891b2 0%,#0e7490 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-telephone-x-fill"></i>
            </div>
            <div className="header-text">
              <h1>Call Not Picked (CNP)</h1>
              <p>
                Leads not responding to calls — schedule, close, or follow up
              </p>
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
                      "linear-gradient(135deg,#0891b2 0%,#0e7490 100%)",
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
                  background: "linear-gradient(135deg,#0891b2 0%,#0e7490 100%)",
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
                  <i className="bi bi-person-search"></i>Search (Name or
                  Contact)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="customerName"
                    value={filters.customerName}
                    onChange={handleFilterChange}
                    placeholder="Search by name or contact number..."
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
                    <i className="bi bi-calendar-day"></i>Today
                  </button>
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label">
                  <i className="bi bi-funnel-fill"></i> Filters
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "20px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="date-range-filters"
                    style={{ display: "flex", gap: "10px" }}
                  >
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
                  {(user?.role === "admin" ||
                    user?.assignedModule === "all") && (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <label>BDM:</label>
                      <select
                        value={filters.bdmFilter}
                        onChange={(e) =>
                          setFilters((p) => ({
                            ...p,
                            bdmFilter: e.target.value,
                          }))
                        }
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "14px",
                          outline: "none",
                          minWidth: "160px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="all">All BDMs</option>
                        <option value="BDM1">BDM1 - Vijaya Rajput</option>
                        <option value="BDM2">
                          BDM2 - Harshita Vishwakarma
                        </option>
                        <option value="BDM6">BDM6 - Sanskriti Tiwari</option>
                        <option value="BDM7">BDM7 - Ritu Gahlot</option>
                        <option value="Varun Sir">Varun Sir</option>
                        <option value="Mohan Sir">Mohan Sir</option>
                      </select>
                    </div>
                  )}
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
                <i className="bi bi-inbox"></i>
              </div>
              <h3>No CNP Leads</h3>
              <p>
                {isAnyFilterActive
                  ? "No matches"
                  : "No leads with Call Not Picked status"}
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
                      <th>
                        <div className="th-content">
                          <i className="bi bi-hash"></i> Unique ID
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person"></i> Customer
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
                          <i className="bi bi-diagram-3"></i> Source
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
                          <i className="bi bi-calendar"></i> Planned Date
                        </div>
                      </th>
                      {!isFSRUser && (
                        <th>
                          <div className="th-content">
                            <i className="bi bi-person-lines-fill"></i> Assign
                            To
                          </div>
                        </th>
                      )}
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
                    {filteredRows.map((r, i) => {
                      const dc = getDoerBadgeColor(r.doer);
                      const ia = assigningLeadId === r.uniqueId;
                      return (
                        <tr
                          key={`${r.sheetName}-${r.rowIndex}`}
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
                                  "linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%)",
                                color: "#0e7490",
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
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0",
                              }}
                            >
                              <a
                                href={`tel:${r.customerContact}`}
                                className="contact-link"
                              >
                                <i className="bi bi-telephone-fill"></i>
                                {r.customerContact || "-"}
                              </a>
                              {r.customerContact && (
                                <button
                                  type="button"
                                  className="wa-icon-btn"
                                  title="Send WhatsApp"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setWaLead(r);
                                  }}
                                >
                                  <i className="bi bi-whatsapp"></i>
                                </button>
                              )}
                            </div>
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
                              className={`planned-badge ${isPlannedDateUrgent(r.plannedDate) ? "urgent-badge" : ""}`}
                              style={{
                                background: isPlannedDateUrgent(r.plannedDate)
                                  ? "#fef2f2"
                                  : "#e0f2fe",
                                color: isPlannedDateUrgent(r.plannedDate)
                                  ? "#dc2626"
                                  : "#0e7490",
                                border: `1px solid ${isPlannedDateUrgent(r.plannedDate) ? "#fca5a5" : "#7dd3fc"}`,
                                padding: "4px 10px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              <i
                                className="bi bi-calendar-event"
                                style={{ marginRight: "4px" }}
                              ></i>
                              {r.plannedDate || "-"}
                            </span>
                          </td>
                          {!isFSRUser && (
                            <td>
                              <div
                                style={{
                                  position: "relative",
                                  display: "inline-block",
                                }}
                              >
                                <select
                                  value={r.doer || ""}
                                  onChange={(e) =>
                                    handleAssignChange(r, e.target.value)
                                  }
                                  disabled={ia}
                                  style={{
                                    padding: "6px 28px 6px 10px",
                                    borderRadius: "8px",
                                    border: `1.5px solid ${dc.border}`,
                                    backgroundColor: dc.bg,
                                    color: dc.color,
                                    fontWeight: "600",
                                    fontSize: "12px",
                                    cursor: ia ? "wait" : "pointer",
                                    outline: "none",
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    MozAppearance: "none",
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${encodeURIComponent(dc.color)}' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: "no-repeat",
                                    backgroundPosition: "right 8px center",
                                    backgroundSize: "10px",
                                    opacity: ia ? 0.6 : 1,
                                    minWidth: "90px",
                                  }}
                                >
                                  <option value="">-- Select --</option>
                                  <option value="BDM1">
                                    BDM1 - Vijya Rajput
                                  </option>
                                  <option value="BDM2">
                                    BDM2 - Harshita Vishwakarma
                                  </option>
                                  <option value="BDM6">
                                    BDM6 - Sanskriti Tiwari
                                  </option>
                                  <option value="BDM7">
                                    BDM7 - Ritu Gahlot
                                  </option>
                                  <option value="Varun Sir">Varun Sir</option>
                                  <option value="Mohan Sir">Mohan Sir</option>
                                </select>
                                {ia && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%,-50%)",
                                      width: "16px",
                                      height: "16px",
                                      border: "2px solid transparent",
                                      borderTopColor: dc.color,
                                      borderRadius: "50%",
                                      animation: "spin 0.6s linear infinite",
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                          )}
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
                                  "linear-gradient(135deg,#0891b2 0%,#0e7490 100%)",
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
                  Showing <strong>{filteredRows.length}</strong> of{" "}
                  <strong>{rows.length}</strong> records
                </div>
                <div className="footer-actions">
                  {isAnyFilterActive && (
                    <button
                      className="clear-filter-btn"
                      onClick={clearFilters}
                      style={{
                        background:
                          "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)",
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
                  background: "linear-gradient(135deg,#0891b2 0%,#0e7490 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-telephone-x-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>CNP — Take Action</h2>
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
                {/* ✅ 4 ACTION BUTTONS — 2x2 grid */}
                <div className="form-section">
                  <label className="form-label-custom">Select Action</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                    }}
                  >
                    {/* 1. Schedule Site Visit */}
                    <div
                      onClick={() => {
                        setActionType("schedule");
                        setFormData((f) => ({
                          ...f,
                          notInterestedReason: "",
                          nextFollowUpDate: "",
                        }));
                      }}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "schedule" ? "#10b981" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "schedule"
                            ? "rgba(16,185,129,0.05)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <i
                        className="bi bi-geo-alt-fill"
                        style={{
                          color: "#10b981",
                          fontSize: "1.5rem",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      ></i>
                      <span
                        style={{
                          fontWeight: "600",
                          color:
                            actionType === "schedule" ? "#10b981" : "#374151",
                        }}
                      >
                        Schedule Site Visit
                      </span>
                    </div>

                    {/* 2. Not Interested */}
                    <div
                      onClick={() => {
                        setActionType("not-interested");
                        setFormData((f) => ({
                          ...f,
                          fieldVisitDate: "",
                          nextFollowUpDate: "",
                        }));
                      }}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "not-interested" ? "#ef4444" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "not-interested"
                            ? "rgba(239,68,68,0.08)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
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

                    {/* 3. CNP Again */}
                    <div
                      onClick={() => {
                        setActionType("cnp-again");
                        setFormData((f) => ({
                          ...f,
                          notInterestedReason: "",
                          fieldVisitDate: "",
                        }));
                      }}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "cnp-again" ? "#0891b2" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "cnp-again"
                            ? "rgba(8,145,178,0.08)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <i
                        className="bi bi-telephone-x-fill"
                        style={{
                          color: "#0891b2",
                          fontSize: "1.5rem",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      ></i>
                      <span
                        style={{
                          fontWeight: "600",
                          color:
                            actionType === "cnp-again" ? "#0891b2" : "#374151",
                        }}
                      >
                        Call Not Picked
                      </span>
                    </div>

                    {/* 4. Next Follow Up */}
                    <div
                      onClick={() => {
                        setActionType("next-followup");
                        setFormData((f) => ({
                          ...f,
                          notInterestedReason: "",
                          fieldVisitDate: "",
                        }));
                      }}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "next-followup" ? "#f59e0b" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "next-followup"
                            ? "rgba(245,158,11,0.08)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <i
                        className="bi bi-calendar-plus-fill"
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
                            actionType === "next-followup"
                              ? "#f59e0b"
                              : "#374151",
                        }}
                      >
                        Next Follow Up
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Schedule — Field Visit Date */}
                  {actionType === "schedule" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#10b981" }}
                        ></i>
                        Field Visit Date <span className="required">*</span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#ef4444",
                            marginLeft: "8px",
                            fontWeight: "normal",
                          }}
                        >
                          (Max 7:00 PM)
                        </span>
                      </label>
                      <div className="input-wrapper">
                        <input
                          type="datetime-local"
                          className="form-input-custom"
                          value={formData.fieldVisitDate}
                          onChange={(e) =>
                            handleDateTimeChange(
                              "fieldVisitDate",
                              e.target.value,
                            )
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", background: "#fff" }}
                        />
                      </div>
                      {formData.fieldVisitDate && (
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
                          <i className="bi bi-check-circle-fill"></i>Selected:{" "}
                          {new Date(formData.fieldVisitDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Not Interested — Reason */}
                  {actionType === "not-interested" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-exclamation-triangle-fill"
                          style={{ color: "#ef4444" }}
                        ></i>
                        Reason for Not Interested{" "}
                        <span className="required">*</span>
                      </label>
                      <div className="input-wrapper">
                        <textarea
                          className="form-input-custom"
                          rows="2"
                          placeholder="Not Interested का reason लिखें..."
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

                  {/* CNP Again — Next FollowUp Date */}
                  {actionType === "cnp-again" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#0891b2" }}
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
                          (Max 7:00 PM)
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
                            color: "#0891b2",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>Selected:{" "}
                          {new Date(formData.nextFollowUpDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Follow Up — Date */}
                  {actionType === "next-followup" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#f59e0b" }}
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
                          (Max 7:00 PM)
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
                            color: "#f59e0b",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i className="bi bi-check-circle-fill"></i>Selected:{" "}
                          {new Date(formData.nextFollowUpDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previous Remarks */}
                  {selectedLead.remarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-left-text"
                          style={{ color: "#8b5cf6" }}
                        ></i>{" "}
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
                        {selectedLead.remarks}
                      </div>
                    </div>
                  )}

                  {selectedLead.oldRemarks &&
                    selectedLead.oldRemarks !== selectedLead.remarks && (
                      <div className="form-section">
                        <label className="form-label-custom">
                          <i
                            className="bi bi-clock-history"
                            style={{ color: "#6b7280" }}
                          ></i>{" "}
                          Old Remarks
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

                  {/* New Remarks */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-square-text-fill"
                        style={{ color: "#0891b2" }}
                      ></i>{" "}
                      New Remarks
                    </label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea-custom"
                        placeholder={
                          actionType === "schedule"
                            ? "Remarks about scheduling..."
                            : actionType === "cnp-again"
                              ? "Optional remarks..."
                              : actionType === "next-followup"
                                ? "Follow-up remarks..."
                                : "Additional remarks..."
                        }
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

              {/* FOOTER */}
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
                    !actionType ||
                    (actionType === "schedule" && !formData.fieldVisitDate) ||
                    (actionType === "cnp-again" &&
                      !formData.nextFollowUpDate) ||
                    (actionType === "next-followup" &&
                      !formData.nextFollowUpDate)
                  }
                  style={{
                    background:
                      actionType === "schedule"
                        ? "linear-gradient(135deg,#10b981 0%,#059669 100%)"
                        : actionType === "not-interested"
                          ? "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)"
                          : actionType === "next-followup"
                            ? "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)"
                            : "linear-gradient(135deg,#0891b2 0%,#0e7490 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>Processing...
                    </>
                  ) : actionType === "schedule" ? (
                    <>
                      <i className="bi bi-geo-alt-fill"></i> Schedule Site Visit
                    </>
                  ) : actionType === "not-interested" ? (
                    <>
                      <i className="bi bi-x-circle"></i> Mark Not Interested
                    </>
                  ) : actionType === "cnp-again" ? (
                    <>
                      <i className="bi bi-telephone-x-fill"></i> Mark CNP Again
                    </>
                  ) : actionType === "next-followup" ? (
                    <>
                      <i className="bi bi-calendar-plus-fill"></i> Schedule
                      Follow Up
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-all"></i> Select Action
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WHATSAPP MODAL */}
        <WhatsAppModal
          isOpen={!!waLead}
          onClose={() => setWaLead(null)}
          lead={waLead}
        />
      </div>
      <style>{`@keyframes spin { 0% { transform: translate(-50%,-50%) rotate(0deg); } 100% { transform: translate(-50%,-50%) rotate(360deg); } }`}</style>
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

export default CNPLeads;
