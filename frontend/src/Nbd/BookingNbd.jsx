import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBookingNbdData, updateBookingNbdLead, assignNBDINLead } from "../services/NbdApi";
import { useAuth } from "../context/AuthContext"; // ✅
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import { toast } from "react-toastify";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

function BookingNbd() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // ✅

  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [assigningLeadId, setAssigningLeadId] = useState(null); // ✅
  const [formData, setFormData] = useState({ status: "Done", block: "", unitNo: "", remarks: "" });
  const [filters, setFilters] = useState({ plannedDateFrom: "", plannedDateTo: "", customerName: "" });
  const [showFilters, setShowFilters] = useState(false);

  const { data: rows = [], isLoading, error, refetch } = useQuery({
    queryKey: ["bookingNbd"],
    queryFn: fetchBookingNbdData,
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
  });

  const filteredRows = rows.filter((row) => {
    if (filters.customerName) {
      const cn = row.customerName?.toLowerCase() || "";
      if (!cn.includes(filters.customerName.toLowerCase().trim())) return false;
    }
    if (!filters.plannedDateFrom && !filters.plannedDateTo) return true;
    const pd = row.plannedDate;
    if (!pd) return false;
    const parseDate = (ds) => { if (!ds) return null; const p = ds.split("/"); if (p.length !== 3) return null; return new Date(parseInt(p[2],10), parseInt(p[1],10)-1, parseInt(p[0],10)); };
    const rd = parseDate(pd);
    if (!rd) return false;
    const norm = (d) => { const n = new Date(d); n.setHours(0,0,0,0); return n; };
    const nr = norm(rd);
    if (filters.plannedDateFrom && nr < norm(new Date(filters.plannedDateFrom))) return false;
    if (filters.plannedDateTo && nr > norm(new Date(filters.plannedDateTo))) return false;
    return true;
  });

  const isAnyFilterActive = filters.plannedDateFrom || filters.plannedDateTo || filters.customerName;

  const updateMutation = useMutation({
    mutationFn: updateBookingNbdLead,
    onSuccess: () => { toast.success("Booking Done Successfully!"); queryClient.invalidateQueries(["bookingNbd"]); handleCloseModal(); },
    onError: (error) => { toast.error("Error: " + (error?.response?.data?.message || error.message)); },
  });

  // ✅ Assign mutation
  const assignMutation = useMutation({
    mutationFn: assignNBDINLead,
    onSuccess: (data) => { toast.success(data.message || "Lead assigned successfully"); queryClient.invalidateQueries(["bookingNbd"]); setAssigningLeadId(null); },
    onError: (error) => { toast.error("❌ Error: " + (error?.response?.data?.error || error?.message || "Failed to assign")); setAssigningLeadId(null); },
  });

  const handleAssignChange = (lead, newAssignTo) => {
    if (lead.doer === newAssignTo) return;
    setAssigningLeadId(lead.uniqueId);
    assignMutation.mutate({ uniqueId: lead.uniqueId, assignTo: newAssignTo });
  };

  const getDoerBadgeColor = (doer) => {
    if (doer === "BDM1") return { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" };
    if (doer === "BDM2") return { bg: "#fce7f3", color: "#9d174d", border: "#f9a8d4" };
    return { bg: "#f3f4f6", color: "#374151", border: "#d1d5db" };
  };

  const handleActionClick = (lead) => { setSelectedLead(lead); setFormData({ status: "Done", block: lead.block || "", unitNo: lead.unitNo || "", remarks: lead.remarks || "" }); setShowModal(true); };
  const handleCloseModal = () => { setShowModal(false); setSelectedLead(null); setFormData({ status: "Done", block: "", unitNo: "", remarks: "" }); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.block?.trim()) { toast.warning("Please enter Block"); return; }
    if (!formData.unitNo?.trim()) { toast.warning("Please enter Unit No"); return; }
    updateMutation.mutate({ sheetName: selectedLead.sheetName, rowIndex: selectedLead.rowIndex, status: "Done", block: formData.block.trim(), unitNo: formData.unitNo.trim(), remarks: formData.remarks.trim() });
  };

  const handleFilterChange = (e) => { const { name, value } = e.target; setFilters((prev) => ({ ...prev, [name]: value })); };
  const clearFilters = () => { setFilters({ plannedDateFrom: "", plannedDateTo: "", customerName: "" }); };

  const getLeadSourceBadge = (source) => {
    if (!source) return <span className="source-tag">-</span>;
    const s = source.toLowerCase();
    if (s.includes("channel") || s.includes("partner") || s.includes("cp")) return <span className="source-tag channel">{source}</span>;
    return <span className="source-tag direct">{source}</span>;
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending" || s === "") return <span className="status-tag pending">Pending</span>;
    if (s === "done") return <span className="status-tag done">Done</span>;
    return <span className="status-tag">{status}</span>;
  };

  return (
    <Layout breadcrumbs={[{ name: "NBD IN", path: "/nbd-in" }, { name: "Booking", path: "/nbd-in/booking" }]}>
      <div className="table-page-container">
        <div className="table-page-bg">
          <div className="table-bg-shape table-bg-shape-1" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}></div>
          <div className="table-bg-shape table-bg-shape-2" style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}></div>
        </div>

        <div className="table-page-header" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
          <div className="header-content">
            <div className="header-icon"><i className="bi bi-bookmark-check-fill"></i></div>
            <div className="header-text"><h1>Booking</h1><p>Manage and track property bookings</p></div>
          </div>
          <div className="header-stats"><div className="stat-box"><span className="stat-number">{filteredRows.length}</span><span className="stat-label">{isAnyFilterActive ? "Filtered" : "Pending"}</span></div></div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-header">
            <div className="filter-title">
              <i className="bi bi-funnel"></i><span>Filters</span>
              {isAnyFilterActive && <span className="active-filter-badge" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", marginLeft: "8px" }}>Active</span>}
            </div>
            <div className="filter-controls">
              <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                <i className={`bi bi-chevron-${showFilters ? "up" : "down"}`}></i>{showFilters ? "Hide Filters" : "Show Filters"}
              </button>
              {isAnyFilterActive && <button className="clear-filters-btn" onClick={clearFilters}><i className="bi bi-x-circle"></i>Clear Filters</button>}
            </div>
          </div>
          {showFilters && (
            <div className="filter-form">
              <div className="filter-group">
                <label className="filter-label"><i className="bi bi-person-search"></i>Customer Name</label>
                <div className="search-input-wrapper" style={{ position: "relative" }}>
                  <input type="text" name="customerName" value={filters.customerName} onChange={handleFilterChange} placeholder="Search by customer name..." className="search-input" style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", transition: "all 0.2s", outline: "none" }} onFocus={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }} />
                  {filters.customerName && <button type="button" onClick={() => setFilters((prev) => ({ ...prev, customerName: "" }))} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }} title="Clear"><i className="bi bi-x-lg"></i></button>}
                </div>
              </div>
              <div className="filter-group">
                <label className="filter-label"><i className="bi bi-calendar-range"></i>Planned Date Range</label>
                <div className="date-range-filters">
                  <div className="date-input-group"><label>From:</label><input type="date" name="plannedDateFrom" value={filters.plannedDateFrom} onChange={handleFilterChange} className="date-input" /></div>
                  <div className="date-input-group"><label>To:</label><input type="date" name="plannedDateTo" value={filters.plannedDateTo} onChange={handleFilterChange} className="date-input" min={filters.plannedDateFrom} /></div>
                </div>
              </div>
              {isAnyFilterActive && (
                <div className="filter-stats">
                  <span className="filter-stat-item"><i className="bi bi-filter-circle"></i>Active Filters:</span>
                  {filters.customerName && <span className="filter-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", color: "#047857" }}><i className="bi bi-person"></i>Name: "{filters.customerName}"<button type="button" onClick={() => setFilters((prev) => ({ ...prev, customerName: "" }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#047857", padding: "0", marginLeft: "4px" }}><i className="bi bi-x"></i></button></span>}
                  {filters.plannedDateFrom && <span className="filter-tag">From: {filters.plannedDateFrom}<button type="button" onClick={() => setFilters((prev) => ({ ...prev, plannedDateFrom: "" }))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0", marginLeft: "4px" }}><i className="bi bi-x"></i></button></span>}
                  {filters.plannedDateTo && <span className="filter-tag">To: {filters.plannedDateTo}<button type="button" onClick={() => setFilters((prev) => ({ ...prev, plannedDateTo: "" }))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0", marginLeft: "4px" }}><i className="bi bi-x"></i></button></span>}
                  <span className="filter-tag results">Results: {filteredRows.length} of {rows.length}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="table-section">
          {isLoading ? <div className="table-loading"><SkeletonTable rowsCount={8} /></div>
          : error ? <div className="table-empty"><div className="empty-icon error"><i className="bi bi-exclamation-triangle"></i></div><h3>Error Loading Data</h3><p>{error.message}</p><button className="empty-clear-btn" onClick={() => refetch()}><i className="bi bi-arrow-clockwise"></i>Try Again</button></div>
          : filteredRows.length === 0 ? <div className="table-empty"><div className="empty-icon"><i className="bi bi-bookmark-x"></i></div><h3>No Bookings Found</h3><p>{isAnyFilterActive ? "No records match your filter criteria" : "No pending bookings at the moment"}</p>{isAnyFilterActive && <button className="empty-clear-btn" onClick={clearFilters}><i className="bi bi-funnel"></i>Clear Filters</button>}</div>
          : (
            <>
              <div className="table-wrapper">
                <table className="modern-table nbdin-table">
                  <thead>
                    <tr>
                      <th><div className="th-content">#</div></th>
                      <th><div className="th-content"><i className="bi bi-hash"></i>Unique ID</div></th>
                      <th><div className="th-content"><i className="bi bi-person"></i>Customer Name</div></th>
                      <th><div className="th-content"><i className="bi bi-telephone"></i>Contact</div></th>
                      <th><div className="th-content"><i className="bi bi-heart"></i>Interested In</div></th>
                      <th><div className="th-content"><i className="bi bi-building"></i>Project</div></th>
                      <th><div className="th-content"><i className="bi bi-diagram-3"></i>Lead Source</div></th>
                      <th><div className="th-content"><i className="bi bi-phone"></i>Lead Gen No</div></th>
                      <th><div className="th-content"><i className="bi bi-person-badge"></i>Lead Gen Name</div></th>
                      <th><div className="th-content"><i className="bi bi-flag"></i>Status</div></th>
                      <th><div className="th-content"><i className="bi bi-calendar"></i>Planned</div></th>
                      {/* ✅ NEW */}
                      <th><div className="th-content"><i className="bi bi-person-lines-fill"></i>Assign To</div></th>
                      <th className="th-action"><div className="th-content"><i className="bi bi-gear"></i>Action</div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => {
                      const doerColors = getDoerBadgeColor(r.doer);
                      const isAssigning = assigningLeadId === r.uniqueId;
                      return (
                        <tr key={i} style={{ animationDelay: `${i * 0.02}s` }}>
                          <td><span className="row-number">{i + 1}</span></td>
                          <td><span className="id-badge" style={{ background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", color: "#047857" }}>{r.uniqueId || "-"}</span></td>
                          <td><span className="customer-name">{filters.customerName ? <HighlightText text={r.customerName || "-"} highlight={filters.customerName} /> : (r.customerName || "-")}</span></td>
                          <td><a href={`tel:${r.customerContact}`} className="contact-link"><i className="bi bi-telephone-fill"></i>{r.customerContact || "-"}</a></td>
                          <td><span className="interest-tag">{r.interestedIn || "-"}</span></td>
                          <td><span className="project-name">{r.projectSelection || "-"}</span></td>
                          <td>{getLeadSourceBadge(r.leadSource)}</td>
                          <td><span className="lead-gen-number">{r.leadGenNumber || "-"}</span></td>
                          <td><span className="lead-gen-name">{r.leadGenName || "-"}</span></td>
                          <td>{getStatusBadge(r.status)}</td>
                          <td><span className="planned-badge green"><i className="bi bi-calendar-event"></i>{r.plannedDate || "-"}</span></td>
                          {/* ✅ Assign To */}
                          <td>
                            <div style={{ position: "relative", display: "inline-block" }}>
                              <select value={r.doer || ""} onChange={(e) => handleAssignChange(r, e.target.value)} disabled={isAssigning} style={{ padding: "6px 28px 6px 10px", borderRadius: "8px", border: `1.5px solid ${doerColors.border}`, backgroundColor: doerColors.bg, color: doerColors.color, fontWeight: "600", fontSize: "12px", cursor: isAssigning ? "wait" : "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='${encodeURIComponent(doerColors.color)}' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "10px", transition: "all 0.2s ease", opacity: isAssigning ? 0.6 : 1, minWidth: "90px" }}>
                                <option value="BDM1">BDM1</option>
                                <option value="BDM2">BDM2</option>
                              </select>
                              {isAssigning && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "16px", height: "16px", border: "2px solid transparent", borderTopColor: doerColors.color, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
                            </div>
                          </td>
                          <td className="action-cell"><button className="action-btn" onClick={() => handleActionClick(r)} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}><i className="bi bi-pencil-square"></i></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <div className="footer-info"><i className="bi bi-info-circle" style={{ color: "#10b981" }}></i>Showing <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong> record{filteredRows.length !== 1 ? "s" : ""}</div>
                <div className="footer-actions">
                  {isAnyFilterActive && <button className="clear-filter-btn" onClick={clearFilters} style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}><i className="bi bi-x-circle"></i>Clear Filter</button>}
                  <button className="refresh-btn" onClick={() => refetch()}><i className="bi bi-arrow-clockwise"></i>Refresh</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && selectedLead && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-custom" style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                <div className="modal-header-content">
                  <div className="modal-icon"><i className="bi bi-bookmark-check-fill"></i></div>
                  <div className="modal-header-text">
                    <h2>Complete Booking</h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge"><i className="bi bi-hash"></i>{selectedLead.uniqueId}</span>
                      <span className="contact-badge"><i className="bi bi-person"></i>{selectedLead.customerName}</span>
                    </div>
                  </div>
                </div>
                <button className="modal-close-btn" onClick={handleCloseModal}><i className="bi bi-x-lg"></i></button>
              </div>

              <div className="modal-body-custom">
                <div className="lead-info-card">
                  <div className="info-grid">
                    <div className="info-item"><span className="info-label"><i className="bi bi-telephone"></i>Contact</span><span className="info-value"><a href={`tel:${selectedLead.customerContact}`} className="contact-link-modal">{selectedLead.customerContact}</a></span></div>
                    <div className="info-item"><span className="info-label"><i className="bi bi-calendar"></i>Planned Date</span><span className="info-value"><span className="planned-tag green">{selectedLead.plannedDate}</span></span></div>
                    <div className="info-item"><span className="info-label"><i className="bi bi-building"></i>Project</span><span className="info-value">{selectedLead.projectSelection || "-"}</span></div>
                    <div className="info-item"><span className="info-label"><i className="bi bi-heart"></i>Interested In</span><span className="info-value">{selectedLead.interestedIn || "-"}</span></div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-section">
                    <label className="form-label-custom"><i className="bi bi-check-circle-fill" style={{ color: "#10b981" }}></i>Status</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", borderRadius: "10px", border: "2px solid #10b981" }}>
                      <i className="bi bi-check-circle-fill" style={{ color: "#059669", fontSize: "20px" }}></i>
                      <span style={{ color: "#047857", fontWeight: "600", fontSize: "16px" }}>Done</span>
                    </div>
                  </div>

                  <div className="form-section" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label className="form-label-custom"><i className="bi bi-building" style={{ color: "#10b981" }}></i>Block <span className="required">*</span></label>
                        <div className="input-wrapper"><input type="text" className="form-input-custom" placeholder="Enter Block (e.g., A, B, C)" value={formData.block} onChange={(e) => setFormData({ ...formData, block: e.target.value })} style={{ color: "#000", backgroundColor: "#fff", borderLeft: "3px solid #10b981", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100%", fontSize: "14px" }} /></div>
                      </div>
                      <div>
                        <label className="form-label-custom"><i className="bi bi-door-open" style={{ color: "#10b981" }}></i>Unit No <span className="required">*</span></label>
                        <div className="input-wrapper"><input type="text" className="form-input-custom" placeholder="Enter Unit No (e.g., 101, 202)" value={formData.unitNo} onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })} style={{ color: "#000", backgroundColor: "#fff", borderLeft: "3px solid #10b981", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e5e7eb", width: "100%", fontSize: "14px" }} /></div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="modal-footer-custom">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}><i className="bi bi-x-circle"></i>Cancel</button>
                <a href="https://script.google.com/a/macros/vipinchauhanassociates.com/s/AKfycbxK1iWb0u9uRHZUeZpgvxHIK0VWqQVHqaHJf4o77A/dev" target="_blank" rel="noopener noreferrer" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "500", display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}><i className="bi bi-box-arrow-up-right"></i>Booking Form Link</a>
                <button type="submit" className="btn-submit" onClick={handleSubmit} disabled={updateMutation.isPending} style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}>
                  {updateMutation.isPending ? (<><div className="spinner"></div>Processing...</>) : (<><i className="bi bi-check-circle-fill"></i>Confirm Booking</>)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
}

const HighlightText = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return <span>{parts.map((part, index) => regex.test(part) ? <mark key={index} style={{ backgroundColor: "#d1fae5", color: "#047857", padding: "0 2px", borderRadius: "2px" }}>{part}</mark> : <span key={index}>{part}</span>)}</span>;
};

export default BookingNbd;