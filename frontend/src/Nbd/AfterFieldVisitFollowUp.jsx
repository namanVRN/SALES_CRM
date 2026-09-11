import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  fetchAfterFieldVisitData,
  updateAfterFieldVisitLead,
  assignNBDINLead,
} from "../services/NbdApi";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";
import { toast } from "react-toastify";

function AfterFieldVisitFollowUp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const location = useLocation();
  const highlightLeadId = location.state?.highlightLeadId || null;
  const fromSearch = location.state?.fromSearch || false;

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [formData, setFormData] = useState({
    status: "",
    dealMeetingDate: "",
    nextFollowUpDate: "",
    remarks: "",
    notInterestedReason: "",
  });

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
    queryKey: ["afterFieldVisit"],
    queryFn: fetchAfterFieldVisitData,
    select: (res) => res?.data || [],
    staleTime: 0,
    refetchOnWindowFocus: true,
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
      if (
        !(row.customerName?.toLowerCase() || "").includes(
          filters.customerName.toLowerCase().trim(),
        )
      )
        return false;
    }

    // BDM filter (admin only)
    if (filters.bdmFilter !== "all") {
      if ((row.fsrDoer || "") !== filters.bdmFilter) return false;
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
    const pd = row.plannedDate;
    if (!pd) return false;
    const parseDate = (ds) => {
      if (!ds) return null;
      const p = ds.split("/");
      if (p.length !== 3) return null;
      return new Date(
        parseInt(p[2], 10),
        parseInt(p[1], 10) - 1,
        parseInt(p[0], 10),
      );
    };
    const rd = parseDate(pd);
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
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const isDateTimeInPast = (v) => {
    if (!v) return false;
    return new Date(v) < new Date();
  };

  const isTimeAfter7PM = (v) => {
    if (!v) return false;
    return new Date(v).getHours() >= 19;
  };

  const handleDateTimeChange = (field, value) => {
    if (isDateTimeInPast(value)) {
      toast.warning("⚠️ Past date और time select नहीं कर सकते!");
      return;
    }

    if (isTimeAfter7PM(value)) {
      toast.warning("⏰ 7 PM के बाद का time select नहीं कर सकते!");

      const date = new Date(value);
      date.setHours(19, 0, 0, 0);

      setFormData({
        ...formData,
        [field]: date.toISOString().slice(0, 16),
      });
      return;
    }

    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const updateMutation = useMutation({
    mutationFn: updateAfterFieldVisitLead,
    onSuccess: () => {
      toast.success("Record updated successfully");
      queryClient.invalidateQueries(["afterFieldVisit"]);
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update");
    },
  });

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
    if (d === "BDM7")
      return { bg: "#fef9c3", color: "#854d0e", border: "#facc15" };
    return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  };

  const getFSRName = (fsrDoer) => {
    if (fsrDoer === "BDM4") return "Ranjeet Gour";
    if (fsrDoer === "BDM5") return "Amit Rohar";
    if (fsrDoer === "Varun Sir") return "Varun Sir";
    if (fsrDoer === "BDM7") return "Ayush Sahu";
    if(fsrDoer === "Mohan Sir") return "Mohan Sir";
    return fsrDoer || "-";
  };

  const isAdmin = user?.role === "admin" || user?.assignedModule === "all";

  const handleActionClick = (lead) => {
    setSelectedLead(lead);
    setFormData({
      status: "",
      dealMeetingDate: "",
      nextFollowUpDate: "",
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
      dealMeetingDate: "",
      nextFollowUpDate: "",
      remarks: "",
      notInterestedReason: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.status) {
      toast.warning("Please select a status");
      return;
    }

    // ✅ COLD — auto 15 days follow up
    if (formData.status === "COLD") {
      const coldDate = new Date();
      coldDate.setDate(coldDate.getDate() + 15);
      coldDate.setHours(10, 0, 0, 0);
      const formatted = coldDate.toISOString().slice(0, 16);
      const payload = {
        sheetName: selectedLead.sheetName,
        rowIndex: selectedLead.rowIndex,
        status: "Next Follow Up",
        remarks: formData.remarks || "COLD - 15 days follow up",
        notInterestedReason: "",
        rescheduleDate: formatted,
        dealMeetingDate: null,
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
      updateMutation.mutate(payload);
      return;
    }

    if (formData.status === "Done" && !formData.dealMeetingDate) {
      toast.warning("Please select Deal Meeting Date");
      return;
    }
    if (
      (formData.status === "No conversation" ||
        formData.status === "Next Follow Up" ||
        formData.status === "Next Field Visit Required") &&
      !formData.nextFollowUpDate
    ) {
      toast.warning("Please select Next FollowUp Date");
      return;
    }

    if (
      formData.dealMeetingDate &&
      isDateTimeInPast(formData.dealMeetingDate)
    ) {
      toast.error("Deal Meeting Date past date/time नहीं हो सकता!");
      return;
    }
    if (
      formData.nextFollowUpDate &&
      isDateTimeInPast(formData.nextFollowUpDate)
    ) {
      toast.error("Next FollowUp Date past date/time नहीं हो सकता!");
      return;
    }
    if (formData.dealMeetingDate && isTimeAfter7PM(formData.dealMeetingDate)) {
      toast.error("Deal Meeting Date में 7 PM के बाद का time नहीं हो सकता!");
      return;
    }
    if (
      formData.nextFollowUpDate &&
      isTimeAfter7PM(formData.nextFollowUpDate)
    ) {
      toast.error("Next FollowUp Date में 7 PM के बाद का time नहीं हो सकता!");
      return;
    }

    if (
      formData.status === "Not Interested" &&
      !formData.notInterestedReason?.trim()
    ) {
      toast.error("Not Interested का reason देना ज़रूरी है!");
      return;
    }

    const payload = {
      sheetName: selectedLead.sheetName,
      rowIndex: selectedLead.rowIndex,
      status: formData.status,
      remarks: formData.remarks,
      notInterestedReason: formData.notInterestedReason?.trim() || "",
      rescheduleDate:
        formData.status === "No conversation" ||
        formData.status === "Next Follow Up" ||
        formData.status === "Next Field Visit Required"
          ? formData.nextFollowUpDate
          : null,
      dealMeetingDate:
        formData.status === "Done" ? formData.dealMeetingDate : null,
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
    updateMutation.mutate(payload);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      plannedDateFrom: "",
      plannedDateTo: "",
      customerName: "",
      followUpCount: "all",
      todayOnly: false,
      bdmFilter: "all",
    });
  };

  const getLeadSourceBadge = (source) => {
    const s = source?.toLowerCase() || "";
    if (s.includes("channel") || s.includes("partner") || s.includes("cp"))
      return <span className="source-tag channel">Channel Partner</span>;
    else if (
      s.includes("Social Media".toLowerCase()) ||
      s.includes("social".toLowerCase()) ||
      s.includes("media".toLowerCase())
    )
      return <span className="source-tag social">Social Media</span>;
    return <span className="source-tag direct">Direct</span>;
  };
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending" || s === "")
      return <span className="status-tag pending">Pending</span>;
    if (s === "no conversation")
      return <span className="status-tag call-again">No conversation</span>;
    if (s === "done") return <span className="status-tag done">Done</span>;
    if (s === "not interested")
      return <span className="status-tag not-interested">Not Interested</span>;
    if (s === "next field visit required")
      return (
        <span
          className="status-tag"
          style={{
            background: "#ede9fe",
            color: "#7c3aed",
            border: "1px solid #c4b5fd",
          }}
        >
          Next Field Visit Required
        </span>
      );
    return <span className="status-tag">{status}</span>;
  };

  const statusOptions = [
    { value: "Done", label: "Done", icon: "bi-check-circle", color: "#10b981" },
    {
      value: "No conversation",
      label: "No conversation",
      icon: "bi-telephone-x",
      color: "#f59e0b",
    },
    {
      value: "Next Follow Up",
      label: "Next Follow Up",
      icon: "bi-calendar-plus",
      color: "#6366f1",
    },
    {
      value: "Next Field Visit Required",
      label: "Next Field Visit Required",
      icon: "bi-geo-alt-fill",
      color: "#8b5cf6",
    },
    {
      value: "Not Interested",
      label: "Not Interested",
      icon: "bi-x-circle",
      color: "#ef4444",
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
        { name: "After Field Visit Follow-UP", path: "/nbd-in/followup" },
      ]}
    >
      <div className="table-page-container">
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
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-chat-dots-fill"></i>
            </div>
            <div className="header-text">
              <h1>After Field Visit Follow-UP</h1>
              <p>Post field visit follow-up activities and deal closure</p>
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
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
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
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
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
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#f59e0b";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(245, 158, 11, 0.1)";
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

                {/* BDM Filter — Admin Only */}
                {isAdmin && (
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
                      <option value="BDM4">BDM4 - Ranjeet Gour</option>
                      <option value="BDM5">BDM5 - Amit Rohar</option>
                      <option value="BDM8">BDM8 - Ayush Dixit</option>
                      <option value="BDM9">BDM9 - Rohit Kumar</option>
                    </select>
                  </div>
                )}
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
                          "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                        color: "#92400e",
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
                          color: "#92400e",
                          padding: "0",
                          marginLeft: "4px",
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </span>
                  )}
                  {filters.followUpCount !== "all" && (
                    <span className="filter-tag">
                      Follow-ups: {filters.followUpCount}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((p) => ({ ...p, followUpCount: "all" }))
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
                  {filters.bdmFilter !== "all" && (
                    <span className="filter-tag">
                      BDM: {filters.bdmFilter}
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((p) => ({ ...p, bdmFilter: "all" }))
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
                  {filters.todayOnly && (
                    <span className="filter-tag">
                      Today Only
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((p) => ({ ...p, todayOnly: false }))
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
                <i className="bi bi-arrow-clockwise"></i> Try Again (Refresh the
                page)
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
                  : "No pending follow-ups at the moment"}
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
                          <i className="bi bi-exclamation-circle"></i> Imp. Note
                        </div>
                      </th>
                      {isAdmin && (
                        <th>
                          <div className="th-content">
                            <i className="bi bi-person-check"></i> Handled By
                          </div>
                        </th>
                      )}
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
                          <i className="bi bi-arrow-repeat"></i>FollowUp Count
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-geo-alt-fill"></i> Field Visit
                          Count
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
                        key={`${r.sheetName || "row"}-${r.rowIndex || i}`}
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
                              background: "#fffbeb",
                              color: "#b45309",
                              border: "1px solid #fcd34d",
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
                            style={{ whiteSpace: "nowrap" }}
                          >
                            <i
                              className="bi bi-telephone-fill"
                              style={{ fontSize: "0.8rem" }}
                            ></i>{" "}
                            {r.customerContact || "-"}
                          </a>
                        </td>
                        <td>
                          <span className="project-name">
                            {r.projectSelection || "-"}
                          </span>
                        </td>
                        <td>{getLeadSourceBadge(r.leadSource)}</td>
                        <td>
                          <span style={{ fontWeight: "500", color: "#4b5563" }}>
                            {r.leadGenNumber || "-"}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: "#4b5563" }}>
                            {r.leadGenName || "-"}
                          </span>
                        </td>
                        <td>
                          {r.importantNote ? (
                            <div
                              title={r.importantNote}
                              style={{
                                maxWidth: "180px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                backgroundColor: "#fee2e2",
                                color: "#991b1b",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "0.8rem",
                                fontWeight: "600",
                                border: "1px solid #fecaca",
                              }}
                            >
                              <i
                                className="bi bi-exclamation-circle-fill"
                                style={{ marginRight: "5px" }}
                              ></i>
                              {r.importantNote}
                            </div>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>-</span>
                          )}
                        </td>
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
                            className={`planned-badge ${isPlannedDateUrgent(r.plannedDate) ? "urgent-badge" : ""}`}
                            style={{
                              background: isPlannedDateUrgent(r.plannedDate)
                                ? undefined
                                : "#f3f4f6",
                              color: isPlannedDateUrgent(r.plannedDate)
                                ? undefined
                                : "#374151",
                              border: isPlannedDateUrgent(r.plannedDate)
                                ? undefined
                                : "1px solid #d1d5db",
                            }}
                          >
                            <i className="bi bi-calendar-event"></i>{" "}
                            {r.plannedDate ? r.plannedDate.split(" ")[0] : "-"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="badge rounded-pill bg-light text-dark border">
                            {r.followUpCount || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            className="badge rounded-pill"
                            style={{
                              background:
                                r.fieldVisitCount > 0
                                  ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                                  : "#f3f4f6",
                              color: r.fieldVisitCount > 0 ? "#fff" : "#9ca3af",
                              border:
                                r.fieldVisitCount > 0
                                  ? "none"
                                  : "1px solid #d1d5db",
                              fontWeight:
                                r.fieldVisitCount > 0 ? "600" : "normal",
                              padding: "4px 10px",
                            }}
                          >
                            <i
                              className="bi bi-geo-alt-fill"
                              style={{ marginRight: "4px", fontSize: "0.8rem" }}
                            ></i>
                            {r.fieldVisitCount || 0}
                          </span>
                        </td>
                        <td>
                          <span
                            className="remarks-text"
                            title={r.remarks}
                            style={{
                              maxWidth: "150px",
                              display: "inline-block",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              color: "#6b7280",
                            }}
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
                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
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
                    style={{ color: "#f59e0b" }}
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
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-chat-dots-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Update Follow-UP Status</h2>
                    <div className="modal-subtitle">
                      <span className="contact-badge">
                        <i className="bi bi-person"></i>{" "}
                        {selectedLead.customerName}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-telephone"></i>
                        {selectedLead.customerContact}
                      </span>
                      <span className="firm-badge">
                        <i className="bi bi-hash"></i> {selectedLead.uniqueId}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <div className="modal-body-custom">
                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-tag-fill"
                        style={{ color: "#f59e0b" }}
                      ></i>{" "}
                      Status <span className="required">*</span>
                    </label>
                    <div
                      className="status-grid"
                      style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                    >
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`status-option ${formData.status === option.value ? "active" : ""}`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              status: option.value,
                              dealMeetingDate: "",
                              nextFollowUpDate: "",
                              notInterestedReason: "",
                            })
                          }
                          style={{ "--option-color": option.color }}
                        >
                          <i className={`bi ${option.icon}`}></i>
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COLD info section */}
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
                    <div
                      className="form-section"
                      style={{
                        background: "rgba(16, 185, 129, 0.05)",
                        borderColor: "rgba(16, 185, 129, 0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className="bi bi-calendar-check-fill"
                          style={{ color: "#10b981" }}
                        ></i>{" "}
                        Deal Meeting Date <span className="required">*</span>
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
                          value={formData.dealMeetingDate}
                          onChange={(e) =>
                            handleDateTimeChange(
                              "dealMeetingDate",
                              e.target.value,
                            )
                          }
                          min={getMinDateTime()}
                          style={{ color: "#000", backgroundColor: "#fff" }}
                        />
                      </div>
                      {formData.dealMeetingDate && (
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
                          {new Date(formData.dealMeetingDate).toLocaleString(
                            "en-IN",
                            { dateStyle: "medium", timeStyle: "short" },
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(formData.status === "No conversation" ||
                    formData.status === "Next Follow Up" ||
                    formData.status === "Next Field Visit Required") && (
                    <div
                      className="form-section"
                      style={{
                        background:
                          formData.status === "Next Field Visit Required"
                            ? "rgba(139, 92, 246, 0.05)"
                            : "rgba(245, 158, 11, 0.05)",
                        borderColor:
                          formData.status === "Next Field Visit Required"
                            ? "rgba(139, 92, 246, 0.2)"
                            : "rgba(245, 158, 11, 0.2)",
                      }}
                    >
                      <label className="form-label-custom">
                        <i
                          className={
                            formData.status === "Next Field Visit Required"
                              ? "bi bi-geo-alt-fill"
                              : "bi bi-calendar-plus"
                          }
                          style={{
                            color:
                              formData.status === "Next Field Visit Required"
                                ? "#8b5cf6"
                                : "#f59e0b",
                          }}
                        ></i>
                        {formData.status === "Next Field Visit Required"
                          ? "Next Field Visit Date"
                          : "Next FollowUp Date"}{" "}
                        <span className="required">*</span>
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
                            color:
                              formData.status === "Next Field Visit Required"
                                ? "#8b5cf6"
                                : "#f59e0b",
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

                  {selectedLead.oldRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-clock-history"
                          style={{ color: "#6b7280" }}
                        ></i>{" "}
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

                  {selectedLead.latestOldRemarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-square-dots"
                          style={{ color: "#3b82f6" }}
                        ></i>{" "}
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

                  {selectedLead.remarks && (
                    <div className="form-section">
                      <label className="form-label-custom">
                        <i
                          className="bi bi-chat-left-text"
                          style={{ color: "#f59e0b" }}
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
                          backgroundColor: "#fffbeb",
                          border: "1px solid #fde68a",
                          borderRadius: "8px",
                          borderLeft: "3px solid #f59e0b",
                          color: "#92400e",
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
                        style={{ color: "#f59e0b" }}
                      ></i>{" "}
                      New Remarks
                    </label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea-custom"
                        placeholder={
                          formData.status === "COLD"
                            ? "Optional remarks for COLD lead..."
                            : "Enter new remarks..."
                        }
                        value={formData.remarks}
                        onChange={(e) =>
                          setFormData({ ...formData, remarks: e.target.value })
                        }
                        rows={3}
                        style={{
                          color: "#000",
                          borderLeft: "3px solid #f59e0b",
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
                      formData.status === "COLD"
                        ? "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)"
                        : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div> Updating...
                    </>
                  ) : formData.status === "COLD" ? (
                    <>
                      <i className="bi bi-snow"></i> Mark COLD
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
              backgroundColor: "#fef3c7",
              color: "#92400e",
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

export default AfterFieldVisitFollowUp;
