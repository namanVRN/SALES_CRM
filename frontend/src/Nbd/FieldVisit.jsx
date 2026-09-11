import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  fetchFieldVisitData,
  updateFieldVisitLead,
  assignNBDINLead,
} from "../services/NbdApi.js";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import { toast } from "react-toastify";
import { useEffect } from "react";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";
import WhatsAppModal from "../components/WhatsAppModal";

function FieldVisit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isFSRUser = user?.assignedModule === "fsr";
  const location = useLocation();
  const highlightLeadId = location.state?.highlightLeadId || null;
  const fromSearch = location.state?.fromSearch || false;
  

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [actionType, setActionType] = useState("");
  const [waLead, setWaLead] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    remarks: "",
    rescheduleDate: "",
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
    queryKey: ["fieldVisit"],
    queryFn: fetchFieldVisitData,
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
    // ✅ Smart search — customer name OR contact number
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

    if (filters.statusFilter !== "all") {
      const rowStatus = (row.status || "Pending").toLowerCase().trim();
      const targetStatus = filters.statusFilter.toLowerCase();

      if (targetStatus === "pending") {
        // Match empty, "pending", or undefined
        if (rowStatus !== "pending" && rowStatus !== "") return false;
      } else {
        if (rowStatus !== targetStatus) return false;
      }
    }

    // BDM filter (admin only)
    if (filters.bdmFilter !== "all") {
      if ((row.doer || "") !== filters.bdmFilter) return false;
    }

    // FollowUp Count filter
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
  filters.statusFilter !== "all";

const getMinDateTime = () => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}T${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
};

const isDateTimeInPast = (v) => (v ? new Date(v) < new Date() : false);

// 7 PM ke baad block karega
const isTimeAfter7PM = (v) => (v ? new Date(v).getHours() >= 19 : false);

const handleDateTimeChange = (field, value) => {
  if (isDateTimeInPast(value)) {
    toast.warning("⚠️ Past date aur time select nahi kar sakte!");
    return;
  }

  if (isTimeAfter7PM(value)) {
    toast.warning("⏰ 7 PM ke baad ka time select nahi kar sakte!");

    const d = new Date(value);
    d.setHours(19, 0, 0, 0); // 7:00 PM

    setFormData({
      ...formData,
      [field]: d.toISOString().slice(0, 16),
    });
    return;
  }

  setFormData({ ...formData, [field]: value });
};

  const updateMutation = useMutation({
    mutationFn: updateFieldVisitLead,
    onSuccess: (d) => {
      toast.success(d.message || "Updated!");
      queryClient.invalidateQueries(["fieldVisit"]);
      handleCloseModal();
    },
    onError: (e) => {
       // ✅ NEW — Specific handling for already processed leads
    if (e?.response?.data?.error === "LEAD_ALREADY_PROCESSED") {
      toast.error(
        e.response.data.message || 
        "Yeh lead pehle hi process ho chuki hai. Refresh karo."
      );
      queryClient.invalidateQueries(["fieldVisit"]);  // Force refresh
      handleCloseModal();
      return;
    }
      toast.error(e?.response?.data?.message || "Failed to update");
    },
  });
  const assignMutation = useMutation({
    mutationFn: assignNBDINLead,
    onSuccess: (d) => {
      toast.success(d.message || "Assigned");
      queryClient.invalidateQueries(["fieldVisit"]);
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

  const getDoerBadgeColor = (d) => {
    if (d === "BDM1")
      return { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" };
    if (d === "BDM2")
      return { bg: "#fce7f3", color: "#9d174d", border: "#f9a8d4" };
    if (d === "BDM6")
      return { bg: "#ecfdf5", color: "#065f46", border: "#6ee7b7" };
    if (d === "BDM7")
    return { bg: "#f3e8ff", color: "#6b21a8", border: "#c084fc" };
   if (d === "BDM9")
    return { bg: "#f3e8ff", color: "#6b21a8", border: "#c084fc" };
    if (d === "Varun Sir")
      return { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" };
    if (d === "Mohan Sir")
      return { bg: "#e0e7ff", color: "#3730a3", border: "#a5b4fc" };
    return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  };

  const handleAction = (lead) => {
    setSelectedLead(lead);
    const cannotMarkDone =
      user?.email === "bdm1@company.com" ||
      user?.email === "bdm2@company.com" ||
      user?.email === "bdm6@company.com" ||
      user?.email === "bdm7@company.com"; 
      user?.email === "bdm9@company.com"; 
    setActionType(cannotMarkDone ? "" : "done");
    setFormData({
      status: cannotMarkDone ? "" : "Done",
      remarks: "",
      rescheduleDate: "",
      notInterestedReason: "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setActionType(""); // was implicit "done" stale
    setSelectedLead(null);
    setFormData({
      status: "Done",
      remarks: "",
      rescheduleDate: "",
      notInterestedReason: "",
    });
  };

  const handleSubmit = (e) => {
    if (!actionType) {
      toast.warning("Please select an action first!");
      return;
    }
    const cannotMarkDone =
      user?.email === "bdm1@company.com" ||
      user?.email === "bdm2@company.com" ||
      user?.email === "bdm6@company.com" ||
      user?.email === "bdm7@company.com";
      user?.email === "bdm9@company.com";
    if (cannotMarkDone && actionType === "done") {
      toast.error("⛔ आप 'Mark as Done' नहीं कर सकते!");
      return;
    }
    e.preventDefault();

    // ✅ COLD — auto 15 days reschedule
    if (actionType === "cold") {
      const coldDate = new Date();
      coldDate.setDate(coldDate.getDate() + 15);
      coldDate.setHours(10, 0, 0, 0);
      updateMutation.mutate({
        sheetName: selectedLead.sheetName,
        rowIndex: selectedLead.rowIndex,
        actionType: "cold", // ✅ ADD
        rescheduleDate: coldDate.toISOString().slice(0, 16),
        remarks: formData.remarks || "COLD - 15 days follow up",
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

    // ✅ Next Followup Required validation
    if (actionType === "next-followup" && !formData.rescheduleDate) {
      toast.error("Please select next follow-up date.");
      return;
    }
    if (
      actionType === "next-followup" &&
      formData.rescheduleDate &&
      isDateTimeInPast(formData.rescheduleDate)
    ) {
      toast.error("Next Follow-up Date past नहीं हो सकता!");
      return;
    }
    if (
      actionType === "next-followup" &&
      formData.rescheduleDate &&
      isTimeAfter7PM(formData.rescheduleDate)
    ) {
      toast.error("7 PM के बाद का time नहीं!");
      return;
    }

    // ✅ Call Not Picked — direct submit
    if (actionType === "call-not-picked") {
      updateMutation.mutate({
        sheetName: selectedLead.sheetName,
        rowIndex: selectedLead.rowIndex,
        actionType: "call-not-picked", // ✅ ADD
        status: "Call Not Picked",
        remarks: formData.remarks || "Call Not Picked",
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

    if (actionType === "reschedule" && !formData.rescheduleDate) {
      toast.error("Please select a date to reschedule.");
      return;
    }
    if (
      actionType === "reschedule" &&
      formData.rescheduleDate &&
      isDateTimeInPast(formData.rescheduleDate)
    ) {
      toast.error("Reschedule Date past नहीं हो सकता!");
      return;
    }
    if (
      actionType === "reschedule" &&
      formData.rescheduleDate &&
      isTimeAfter7PM(formData.rescheduleDate)
    ) {
      toast.error("7 PM के बाद का time नहीं!");
      return;
    }
    if (
      actionType === "not-interested" &&
      !formData.notInterestedReason.trim()
    ) {
      toast.error("Not Interested का reason देना ज़रूरी है!");
      return;
    }

    const payload = {
      sheetName: selectedLead.sheetName,
      rowIndex: selectedLead.rowIndex,
      actionType: actionType, // ✅ ADD — हर case में
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

    if (actionType === "done") {
      payload.status = "Done";
    } else if (actionType === "reschedule") {
      payload.rescheduleDate = formData.rescheduleDate;
      // ✅ reschedule के लिए status नहीं — rescheduleDate से detect होगा
    } else if (actionType === "next-followup") {
      payload.rescheduleDate = formData.rescheduleDate;
      // status नहीं भेजना — backend actionType से detect करेगा
    } else if (actionType === "not-interested") {
      payload.status = "Not Interested";
      payload.notInterestedReason = formData.notInterestedReason.trim();
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
      statusFilter: "all",
    });

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase().trim();

    // Pending / Empty
    if (!s || s === "pending") {
      return (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#f3f4f6",
            color: "#6b7280",
            border: "1px solid #d1d5db",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="bi bi-clock"></i> Pending
        </span>
      );
    }

    // Rescheduled
    if (s === "rescheduled") {
      return (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#fce7f3",
            color: "#9d174d",
            border: "1px solid #f9a8d4",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="bi bi-calendar-event"></i> Rescheduled
        </span>
      );
    }

    // Next Followup Required
    if (s === "next followup required") {
      return (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fcd34d",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="bi bi-arrow-repeat"></i> Next Followup
        </span>
      );
    }

    // COLD
    if (s === "cold") {
      return (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#e0f2fe",
            color: "#0369a1",
            border: "1px solid #7dd3fc",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="bi bi-snow"></i> COLD
        </span>
      );
    }

    // Call Not Picked
    if (s === "call not picked") {
      return (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#cffafe",
            color: "#155e75",
            border: "1px solid #67e8f9",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="bi bi-telephone-x"></i> CNP
        </span>
      );
    }

    // Done
    if (s === "done") {
      return (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#d1fae5",
            color: "#065f46",
            border: "1px solid #6ee7b7",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <i className="bi bi-check-circle-fill"></i> Done
        </span>
      );
    }

    // Default fallback
    return (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "8px",
          fontSize: "11px",
          fontWeight: "600",
          background: "#f3f4f6",
          color: "#374151",
          border: "1px solid #d1d5db",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
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

  return (
    <Layout
      breadcrumbs={[
        { name: "NBD IN", path: "/nbd-in" },
        { name: "Field Visit", path: "/nbd-in/field-visit" },
      ]}
    >
      <div className="table-page-container">
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg,#ec4899,#f43f5e)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}
          ></div>
        </div>
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg,#ec4899 0%,#f43f5e 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <div className="header-text">
              <h1>Field Visit</h1>
              <p>Schedule and track field visits with leads</p>
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
                      "linear-gradient(135deg,#ec4899 0%,#f43f5e 100%)",
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
                  background: "linear-gradient(135deg,#ec4899 0%,#f43f5e 100%)",
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
                      e.target.style.borderColor = "#ec4899";
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
                  <label className="filter-label">
                    <i className="bi bi-flag-fill"></i> Status
                  </label>
                  <select
                    value={filters.statusFilter}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        statusFilter: e.target.value,
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
                    <option value="all">All Statuses</option>
                    <option value="pending">🕐 Pending</option>
                    <option value="rescheduled">📅 Rescheduled</option>
                    <option value="next followup required">
                      🔄 Next Followup
                    </option>
                    <option value="cold">❄️ COLD</option>
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
                        <option value="BDM6">BDM6 - Sanskriti tiwari</option>
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
              <h3>No Field Visits</h3>
              <p>{isAnyFilterActive ? "No matches" : "No pending visits"}</p>
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
                          <i className="bi bi-flag-fill"></i> Status
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar"></i> Planned
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
                                  "linear-gradient(135deg,#fce7f3 0%,#fbcfe8 100%)",
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
                                {filters.customerName ? (
                                  <HighlightText
                                    text={String(r.customerContact || "-")}
                                    highlight={filters.customerName}
                                  />
                                ) : (
                                  r.customerContact || "-"
                                )}
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
                              className={`planned-badge pink ${isPlannedDateUrgent(r.plannedDate) ? "urgent-badge" : ""}`}
                            >
                              <i className="bi bi-calendar-event"></i>
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
                                  <option value="BDM1">BDM1 - Vijya Rajput</option>
                                  <option value="BDM2">BDM2 - Harshita Vishwakarma</option>
                                  <option value="BDM6">BDM6 - Sanskriti tiwari</option>
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
                                  "linear-gradient(135deg,#ec4899 0%,#f43f5e 100%)",
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
                    style={{ color: "#ec4899" }}
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
                  background: "linear-gradient(135deg,#ec4899 0%,#f43f5e 100%)",
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
                    {!(
                      user?.email === "bdm1@company.com" ||
                      user?.email === "bdm2@company.com" ||
                      user?.email === "bdm6@company.com" ||
                      user?.email === "bdm7@company.com"
                    ) && (
                      <div
                        onClick={() => {
                          setActionType("done");
                          setFormData((f) => ({
                            ...f,
                            notInterestedReason: "",
                          }));
                        }}
                        style={{
                          padding: "15px",
                          border: `2px solid ${actionType === "done" ? "#10b981" : "#e2e8f0"}`,
                          borderRadius: "10px",
                          background:
                            actionType === "done"
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
                          Mark as Done
                        </span>
                      </div>
                    )}
                    <div
                      onClick={() => {
                        setActionType("reschedule");
                        setFormData((f) => ({ ...f, notInterestedReason: "" }));
                      }}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "reschedule" ? "#ec4899" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "reschedule"
                            ? "rgba(236,72,153,0.05)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
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
                    <div
                      onClick={() => setActionType("not-interested")}
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
                    {/* ✅ COLD Button */}
                    <div
                      onClick={() => {
                        setActionType("cold");
                        setFormData((f) => ({
                          ...f,
                          notInterestedReason: "",
                          status: "COLD",
                        }));
                      }}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "cold" ? "#0ea5e9" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "cold"
                            ? "rgba(14,165,233,0.08)"
                            : "#fff",
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <i
                        className="bi bi-snow"
                        style={{
                          color: "#0ea5e9",
                          fontSize: "1.5rem",
                          display: "block",
                          marginBottom: "8px",
                        }}
                      ></i>
                      <span
                        style={{
                          fontWeight: "600",
                          color: actionType === "cold" ? "#0ea5e9" : "#374151",
                        }}
                      >
                        COLD (15+ Days)
                      </span>
                    </div>

                    {/* ✅ Next Followup Required Button */}
                    <div
                      onClick={() => {
                        setActionType("next-followup");
                        setFormData((f) => ({ ...f, notInterestedReason: "" }));
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
                            actionType === "next-followup"
                              ? "#f59e0b"
                              : "#374151",
                        }}
                      >
                        Next Followup Required
                      </span>
                    </div>

                    {/* ✅ Call Not Picked Button */}
                    <div
                      onClick={() => {
                        setActionType("call-not-picked");
                        setFormData((f) => ({ ...f, notInterestedReason: "" }));
                      }}
                      style={{
                        padding: "15px",
                        border: `2px solid ${actionType === "call-not-picked" ? "#0891b2" : "#e2e8f0"}`,
                        borderRadius: "10px",
                        background:
                          actionType === "call-not-picked"
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
                            actionType === "call-not-picked"
                              ? "#0891b2"
                              : "#374151",
                        }}
                      >
                        Call Not Picked
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
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

                  {actionType === "reschedule" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-plus"
                          style={{ color: "#ec4899" }}
                        ></i>
                        New Visit Date <span className="required">*</span>
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
                          value={formData.rescheduleDate}
                          onChange={(e) =>
                            handleDateTimeChange(
                              "rescheduleDate",
                              e.target.value,
                            )
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", background: "#fff" }}
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

                  {actionType === "next-followup" && (
                    <div
                      className="form-section"
                      style={{ animation: "fadeIn 0.3s" }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-arrow-repeat"
                          style={{ color: "#f59e0b" }}
                        ></i>
                        Next Follow-up Date <span className="required">*</span>
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
                          value={formData.rescheduleDate}
                          onChange={(e) =>
                            handleDateTimeChange(
                              "rescheduleDate",
                              e.target.value,
                            )
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", background: "#fff" }}
                        />
                      </div>
                      {formData.rescheduleDate && (
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
                          {new Date(formData.rescheduleDate).toLocaleString(
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

                  {actionType === "cold" && (
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
                        <i className="bi bi-snow"></i>
                        Next follow-up will be scheduled after 15 days
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

                  {selectedLead.remarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-left-text"
                          style={{ color: "#8b5cf6" }}
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
                          ></i>
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
                              : actionType === "cold"
                                ? "Optional remarks for COLD lead..."
                                : "Additional remarks..."
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
                    (actionType === "next-followup" && !formData.rescheduleDate)
                  }
                  style={{
                    background:
                      actionType === "cold"
                        ? "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)"
                        : actionType === "next-followup"
                          ? "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)"
                          : "linear-gradient(135deg,#ec4899 0%,#f43f5e 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>Processing...
                    </>
                  ) : actionType === "done" ? (
                    <>
                      <i className="bi bi-check2-all"></i>Complete Visit
                    </>
                  ) : actionType === "not-interested" ? (
                    <>
                      <i className="bi bi-x-circle"></i>Mark Not Interested
                    </>
                  ) : actionType === "cold" ? (
                    <>
                      <i className="bi bi-snow"></i>Mark COLD
                    </>
                  ) : actionType === "call-not-picked" ? (
                    <>
                      <i className="bi bi-telephone-x"></i> Mark Call Not Picked
                    </>
                  ) : actionType === "next-followup" ? (
                    <>
                      <i className="bi bi-arrow-repeat"></i> Set Next Followup
                    </>
                  ) : (
                    <>
                      <i className="bi bi-calendar-check"></i>Reschedule
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
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
              backgroundColor: "#fce7f3",
              color: "#be185d",
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

export default FieldVisit;
