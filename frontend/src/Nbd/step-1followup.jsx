import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  fetchNBDINData,
  updateNBDINLead,
  assignNBDINLead,
} from "../services/NbdApi";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import WhatsAppModal from "../components/WhatsAppModal";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";
import { toast } from "react-toastify";

function NBDIN() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();
  const highlightLeadId = location.state?.highlightLeadId || null;
  const fromSearch = location.state?.fromSearch || false;

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assigningLeadId, setAssigningLeadId] = useState(null);

  // ✅ NEW: WhatsApp modal state
  const [waLead, setWaLead] = useState(null);

  const [formData, setFormData] = useState({
    status: "",
    fieldVisitDate: "",
    nextFollowUpDate: "",
    remarks: "",
    importantNote: "",
    pickAndDrop: "No",
    notInterestedReason: "",
  });
  const [filters, setFilters] = useState({
    plannedDateFrom: "",
    plannedDateTo: "",
    customerName: "",
    followUpCount: "all",
    todayOnly: false,
    bdmFilter: "all",
     statusFilter: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: rows = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["nbdin"],
    queryFn: fetchNBDINData,
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

  const filteredRows = rows.filter((row) => {
    if (filters.customerName) {
      const searchTerm = filters.customerName.toLowerCase().trim();
      const nameMatch = (row.customerName?.toLowerCase() || "").includes(
        searchTerm,
      );
      const contactMatch = (row.customerContact?.toLowerCase() || "").includes(
        searchTerm,
      );
      if (!nameMatch && !contactMatch) return false;
    }
    if (filters.bdmFilter !== "all") {
      if ((row.doer || "") !== filters.bdmFilter) return false;
    }
    
     if (filters.statusFilter !== "all") {
    const rowStatus = (row.status || "Pending").toLowerCase().trim();
    const targetStatus = filters.statusFilter.toLowerCase();
    
    if (targetStatus === "pending") {
      if (rowStatus !== "pending" && rowStatus !== "") return false;
    } else {
      if (rowStatus !== targetStatus) return false;
    }
  }
  
    if (filters.followUpCount !== "all") {
      const count = parseInt(row.followUpCount || row.followupCount || 0);
      if (filters.followUpCount === "0" && count !== 0) return false;
      if (filters.followUpCount === "1" && count !== 1) return false;
      if (filters.followUpCount === "2" && count !== 2) return false;
      if (filters.followUpCount === "3" && count !== 3) return false;
      if (filters.followUpCount === "4" && count !== 4) return false;
      if (filters.followUpCount === "5+" && count < 5) return false;
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
    filters.bdmFilter !== "all" ||
    filters.statusFilter !== "all";

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
      setFormData({ ...formData, [field]: d.toISOString().slice(0, 16) });
      return;
    }
    setFormData({ ...formData, [field]: value });
  };

  const updateMutation = useMutation({
    mutationFn: updateNBDINLead,
    onSuccess: () => {
      toast.success("Record updated successfully");
      queryClient.invalidateQueries(["nbdin"]);
      handleCloseModal();
    },
    onError: (e) => {
      toast.error("❌ Error: " + (e?.message || "Something went wrong"));
    },
  });
  const assignMutation = useMutation({
    mutationFn: assignNBDINLead,
    onSuccess: (d) => {
      toast.success(d.message || "Lead assigned");
      queryClient.invalidateQueries(["nbdin"]);
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

  const handleActionClick = (lead) => {
    setSelectedLead(lead);
    setFormData({
      status: "",
      fieldVisitDate: "",
      nextFollowUpDate: "",
      remarks: "",
      importantNote: lead.importantNote || "",
      pickAndDrop: lead.pickAndDrop || "No",
      notInterestedReason: "",
    });
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      status: "",
      fieldVisitDate: "",
      nextFollowUpDate: "",
      remarks: "",
      importantNote: "",
      pickAndDrop: "No",
      notInterestedReason: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.status === "COLD") {
      const coldDate = new Date();
      coldDate.setDate(coldDate.getDate() + 15);
      coldDate.setHours(10, 0, 0, 0);
      const formatted = coldDate.toISOString().slice(0, 16);
      updateMutation.mutate({
        sheetName: selectedLead.sheetName,
        rowIndex: selectedLead.rowIndex,
        status: "Next Follow Up",
        nextFollowUpDate: formatted,
        currentFollowUpCount: selectedLead.followUpCount,
        remarks: formData.remarks || "COLD - 15 days follow up",
        importantNote: formData.importantNote,
        pickAndDrop: formData.pickAndDrop,
        notInterestedReason: "",
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
      return;
    }
    if (
      (formData.status === "No conversation" ||
        formData.status === "Next Follow Up") &&
      !formData.nextFollowUpDate
    ) {
      toast.warning("Please select Next FollowUp Date");
      return;
    }
    if (formData.fieldVisitDate && isDateTimeInPast(formData.fieldVisitDate)) {
      toast.error("Field Visit Date past date/time नहीं हो सकता!");
      return;
    }
    if (
      formData.nextFollowUpDate &&
      isDateTimeInPast(formData.nextFollowUpDate)
    ) {
      toast.error("Next FollowUp Date past date/time नहीं हो सकता!");
      return;
    }
    if (formData.fieldVisitDate && isTimeAfter6PM(formData.fieldVisitDate)) {
      toast.error("Field Visit Date में 6 PM के बाद का time नहीं हो सकता!");
      return;
    }
    if (
      formData.nextFollowUpDate &&
      isTimeAfter6PM(formData.nextFollowUpDate)
    ) {
      toast.error("Next FollowUp Date में 6 PM के बाद का time नहीं हो सकता!");
      return;
    }
    if (
      formData.status === "Not Interested" &&
      !formData.notInterestedReason?.trim()
    ) {
      toast.error("Not Interested का reason देना ज़रूरी है!");
      return;
    }
    updateMutation.mutate({
      sheetName: selectedLead.sheetName,
      rowIndex: selectedLead.rowIndex,
      status: formData.status,
      fieldVisitDate: formData.fieldVisitDate,
      nextFollowUpDate: formData.nextFollowUpDate,
      currentFollowUpCount: selectedLead.followUpCount,
      remarks: formData.remarks,
      importantNote: formData.importantNote,
      pickAndDrop: formData.pickAndDrop,
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
  const clearFilters = () =>
    setFilters({
      plannedDateFrom: "",
      plannedDateTo: "",
      customerName: "",
      followUpCount: "all",
      todayOnly: false,
      bdmFilter: "all",
       statusFilter: "all",
    });

  const getStatusBadge = (status) => {
  const s = (status || "").toLowerCase().trim();

  const baseStyle = {
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  };

  if (!s || s === "pending") {
    return (
      <span style={{ ...baseStyle, background: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db" }}>
        <i className="bi bi-clock"></i> Pending
      </span>
    );
  }
  if (s === "no conversation") {
    return (
      <span style={{ ...baseStyle, background: "#e0e7ff", color: "#3730a3", border: "1px solid #a5b4fc" }}>
        <i className="bi bi-telephone-x"></i> No Conversation
      </span>
    );
  }
  if (s === "next follow up") {
    return (
      <span style={{ ...baseStyle, background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" }}>
        <i className="bi bi-arrow-repeat"></i> Next Follow Up
      </span>
    );
  }
  if (s === "done") {
    return (
      <span style={{ ...baseStyle, background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7" }}>
        <i className="bi bi-check-circle-fill"></i> Done
      </span>
    );
  }
  if (s === "not interested") {
    return (
      <span style={{ ...baseStyle, background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
        <i className="bi bi-x-circle-fill"></i> Not Interested
      </span>
    );
  }
  if (s === "cold") {
    return (
      <span style={{ ...baseStyle, background: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc" }}>
        <i className="bi bi-snow"></i> COLD
      </span>
    );
  }

  return (
    <span style={{ ...baseStyle, background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" }}>
      {status}
    </span>
  );
};

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
     if (d === "BDM7")
    return { bg: "#f3e8ff", color: "#6b21a8", border: "#c084fc" };
    if (d === "Varun Sir")
      return { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" };
    if (d === "Mohan Sir")
      return { bg: "#e0e7ff", color: "#3730a3", border: "#a5b4fc" };
    return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  };


  useEffect(() => {
  if (highlightLeadId && fromSearch && rows.length > 0) {
    // Wait for DOM to render
    setTimeout(() => {
      const targetRow = document.querySelector(
        `[data-lead-id="${highlightLeadId}"]`
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

  const statusOptions = [
    { value: "Done", label: "Done", icon: "bi-check-circle", color: "#10b981" },
    {
      value: "No conversation",
      label: "No Conversation",
      icon: "bi-telephone-x",
      color: "#6366f1",
    },
    {
      value: "Not Interested",
      label: "Not Interested",
      icon: "bi-x-circle",
      color: "#ef4444",
    },
    {
      value: "Next Follow Up",
      label: "Next Follow Up",
      icon: "bi-calendar-plus",
      color: "#f59e0b",
    },
    {
      value: "COLD",
      label: "COLD (15+ Days)",
      icon: "bi-snow",
      color: "#0ea5e9",
    },
  ];

  return (
    <Layout
      breadcrumbs={[
        { name: "NBD IN", path: "/nbd-in" },
        { name: "Step 1 Followup", path: "/nbd-in/step-1-followup" },
      ]}
    >
      <div className="table-page-container">
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
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-telephone-outbound-fill"></i>
            </div>
            <div className="header-text">
              <h1>NBD IN - Step 1 Followup</h1>
              <p>Initial follow-up with qualified leads</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{filteredRows.length}</span>
              <span className="stat-label">
                {isAnyFilterActive ? "Filtered" : "Leads"}
              </span>
            </div>
          </div>
        </div>

        {/* ... filter section unchanged ... */}
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
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
                      e.target.style.borderColor = "#6366f1";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(99,102,241,0.1)";
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
    <label className="filter-label">
      <i className="bi bi-flag-fill"></i> Status
    </label>
    <select
      value={filters.statusFilter}
      onChange={(e) =>
        setFilters((p) => ({ ...p, statusFilter: e.target.value }))
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
      <option value="all">All Statuses</option>
      <option value="pending">🕐 Pending</option>
      <option value="no conversation">📞❌ No Conversation</option>
      <option value="next follow up">🔄 Next Follow Up</option>
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
                    <i className="bi bi-calendar-day"></i> Today
                  </button>
                </div>
                {(user?.role === "admin" || user?.assignedModule === "all") && (
                  <div>
                    <label className="filter-label">
                      <i className="bi bi-person-badge-fill"></i> BDM
                    </label>
                    <select
                      value={filters.bdmFilter}
                      onChange={(e) =>
                        setFilters((p) => ({ ...p, bdmFilter: e.target.value }))
                      }
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "14px",
                        outline: "none",
                        minWidth: "140px",
                        cursor: "pointer",
                      }}
                    >
                      <option value="all">All BDMs</option>
                      <option value="BDM1">BDM1 - Vijaya Rajput</option>
                      <option value="BDM2">BDM2 - Harshita Vishwakarma</option>
                      <option value="BDM6">BDM6 - Sanskriti tiwari</option>
                      <option value="BDM7">BDM7 - Ritu Gahlot</option>
                      <option value="Varun Sir">Varun Sir</option>
                      <option value="Mohan Sir">Mohan Sir</option>
                    </select>
                  </div>
                )}
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
                <i className="bi bi-arrow-clockwise"></i>Try Again (Refresh the page)
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-inbox"></i>
              </div>
              <h3>No Records Found</h3>
              <p>
                {isAnyFilterActive
                  ? "No records match your filter criteria"
                  : "No pending leads at the moment"}
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
                          <i className="bi bi-flag"></i> Status
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar"></i> Planned
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-person-lines-fill"></i> Assign To
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-arrow-repeat"></i> FollowUp
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-journal-text"></i> Imp. Note
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
                          key={`${r.sheetName || "r"}-${r.rowIndex || i}`}
                          data-lead-id={r.uniqueId}  // ✅ NEW
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
                                  "linear-gradient(135deg,#ede9fe 0%,#ddd6fe 100%)",
                                color: "#5b21b6",
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
                          {/* ✅ CONTACT CELL with WhatsApp button */}
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
                          <td>{getStatusBadge(r.status)}</td>
                          <td>
                            <span
                              className={`planned-badge ${isPlannedDateUrgent(r.plannedDate) ? "urgent-badge" : ""}`}
                            >
                              <i className="bi bi-calendar-event"></i>
                              {r.plannedDate || "-"}
                            </span>
                          </td>
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
                                  transition: "all 0.2s ease",
                                  opacity: ia ? 0.6 : 1,
                                  minWidth: "90px",
                                }}
                              >
                                <option value="BDM1">BDM1 - Vijya Rajput</option>
                                <option value="BDM2">BDM2 - Harshita Vishwakarma</option>
                                <option value="BDM6">BDM6 - Sanskriti Tiwari</option>
                                <option value="BDM7">BDM7 - Ritu Gahlot</option>
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
                          <td>
                            <span className="followup-count">
                              {r.followUpCount || 0}
                            </span>
                          </td>
                          <td>
                            <span
                              className="remarks-text"
                              style={{
                                maxWidth: "150px",
                                display: "inline-block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: r.importantNote ? "#d946ef" : "#6b7280",
                                fontWeight: r.importantNote ? "600" : "400",
                              }}
                              title={r.importantNote}
                            >
                              {r.importantNote || "-"}
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
                              onClick={() => handleActionClick(r)}
                              style={{
                                background:
                                  "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
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
                    style={{ color: "#6366f1" }}
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
                          "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)",
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

        {/* EXISTING ACTION MODAL — unchanged */}
        {showModal && selectedLead && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ... same existing modal body - keep your existing action modal code here ... */}
              <div
                className="modal-header-custom"
                style={{
                  background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-pencil-square"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Update Lead</h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge">
                        <i className="bi bi-person"></i>
                        {selectedLead.customerName || "Unknown"}
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
                <div className="lead-info-card">
                  <div className="info-grid">
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
                        style={{ color: "#6366f1" }}
                      ></i>{" "}
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
                              fieldVisitDate: "",
                              nextFollowUpDate: "",
                              notInterestedReason: "",
                            })
                          }
                        >
                          <i className={`bi ${o.icon}`}></i>
                          <span>{o.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {formData.status === "COLD" && (
                    <div
                      className="form-section"
                      style={{
                        animation: "fadeIn 0.3s",
                        background: "rgba(14,165,233,0.05)",
                        borderColor: "rgba(14,165,233,0.2)",
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
                        <i className="bi bi-snow"></i>Next follow-up will be
                        scheduled after 15 days automatically
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
                          {new Date(
                            Date.now() + 15 * 24 * 60 * 60 * 1000,
                          ).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })}
                        </strong>{" "}
                        at 10:00 AM
                      </div>
                    </div>
                  )}

                  {formData.status === "Not Interested" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s ease-in-out" }}
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

                  {formData.status === "Done" && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-event"
                          style={{ color: "#6366f1" }}
                        ></i>
                        Field Visit Schedule Date
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
                          style={{ color: "#000", backgroundColor: "#fff" }}
                        />
                      </div>
                      {formData.fieldVisitDate && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#6366f1",
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

                  {(formData.status === "No conversation" ||
                    formData.status === "Next Follow Up") && (
                    <div
                      className="form-section meeting-date-section"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)",
                        borderColor: "rgba(99,102,241,0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#000" }}
                        ></i>
                        Next FollowUp Date <span className="required">*</span>
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
                          style={{ color: "#000", backgroundColor: "#fff" }}
                        />
                      </div>
                      {formData.nextFollowUpDate && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#6366f1",
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

                  {selectedLead.remarks && (
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
                        {selectedLead.remarks}
                      </div>
                    </div>
                  )}

                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-journal-text"
                        style={{ color: "#d946ef" }}
                      ></i>{" "}
                      Important Note
                    </label>
                    <div className="input-wrapper">
                      <textarea
                        className="form-input-custom"
                        rows="2"
                        placeholder="Add important note (optional)..."
                        value={formData.importantNote}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            importantNote: e.target.value,
                          })
                        }
                        style={{
                          color: "#000",
                          backgroundColor: "#fff",
                          resize: "vertical",
                          borderLeft: "3px solid #d946ef",
                        }}
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-car-front-fill"
                        style={{ color: "#f59e0b" }}
                      ></i>{" "}
                      Pick and Drop Required?
                    </label>
                    <div
                      style={{ display: "flex", gap: "20px", marginTop: "5px" }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border:
                            formData.pickAndDrop === "Yes"
                              ? "1px solid #10b981"
                              : "1px solid #e5e7eb",
                          backgroundColor:
                            formData.pickAndDrop === "Yes" ? "#d1fae5" : "#fff",
                          color:
                            formData.pickAndDrop === "Yes"
                              ? "#065f46"
                              : "#374151",
                          fontWeight: "500",
                        }}
                      >
                        <input
                          type="radio"
                          name="pickAndDrop"
                          value="Yes"
                          checked={formData.pickAndDrop === "Yes"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pickAndDrop: e.target.value,
                            })
                          }
                          style={{ accentColor: "#10b981" }}
                        />{" "}
                        Yes
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border:
                            formData.pickAndDrop === "No"
                              ? "1px solid #ef4444"
                              : "1px solid #e5e7eb",
                          backgroundColor:
                            formData.pickAndDrop === "No" ? "#fee2e2" : "#fff",
                          color:
                            formData.pickAndDrop === "No"
                              ? "#991b1b"
                              : "#374151",
                          fontWeight: "500",
                        }}
                      >
                        <input
                          type="radio"
                          name="pickAndDrop"
                          value="No"
                          checked={formData.pickAndDrop === "No"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              pickAndDrop: e.target.value,
                            })
                          }
                          style={{ accentColor: "#ef4444" }}
                        />{" "}
                        No
                      </label>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-text"
                        style={{ color: "#6366f1" }}
                      ></i>{" "}
                      New Remarks
                    </label>
                    <div className="input-wrapper">
                      <textarea
                        className="form-input-custom"
                        rows="3"
                        placeholder={
                          formData.status === "COLD"
                            ? "Optional remarks for COLD lead..."
                            : "Add new remarks here..."
                        }
                        value={formData.remarks}
                        onChange={(e) =>
                          setFormData({ ...formData, remarks: e.target.value })
                        }
                        style={{
                          color: "#000",
                          backgroundColor: "#fff",
                          resize: "vertical",
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
                  <i className="bi bi-x-circle"></i>Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending || !formData.status}
                  style={{
                    background:
                      formData.status === "COLD"
                        ? "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)"
                        : "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>Updating...
                    </>
                  ) : formData.status === "COLD" ? (
                    <>
                      <i className="bi bi-snow"></i>Mark COLD
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

        {/* ✅ WHATSAPP MODAL */}
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
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              backgroundColor: "#fef08a",
              padding: "0 2px",
              borderRadius: "2px",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
};

export default NBDIN;
