import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFollowupData } from "../services/fmsApi";
import FollowupModal from "./FollowupModal";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import "../assets/styles/TablePages.css";

function Followup() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["followup", fromDate, toDate, status],
    queryFn: () =>
      fetchFollowupData({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        status: status || undefined,
      }),
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  const handleApplyFilter = () => {
    if ((fromDate || toDate) && (!fromDate || !toDate)) {
      alert("Please select both From and To dates");
      return;
    }
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      alert("From Date cannot be after To Date");
      return;
    }
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    setStatus("");
  };

  const formatDate = (dateVal) => {
    if (!dateVal || dateVal === "-") return "-";
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return dateVal.toString();
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Outgoing", path: "/channel-partner/cp-outgoing" },
        { name: "Followup", path: "/followup" },
      ]}
    >
      <div className="table-page-container">
        {/* Background Elements */}
        <div className="table-page-bg">
          <div className="table-bg-shape table-bg-shape-1" style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)" }}></div>
          <div className="table-bg-shape table-bg-shape-2" style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)" }}></div>
        </div>

        {/* Header Section */}
        <div className="table-page-header" style={{ background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)" }}>
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-chat-dots-fill"></i>
            </div>
            <div className="header-text">
              <h1>Follow-up</h1>
              <p>Manage and track your follow-up conversations</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{rows.length}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-header">
            <div className="filter-title">
              <i className="bi bi-funnel-fill"></i>
              <span>Filter Records</span>
            </div>
            <button
              className="filter-clear-btn"
              onClick={handleClearFilter}
              disabled={isLoading || (!fromDate && !toDate && !status)}
            >
              <i className="bi bi-x-circle"></i>
              Clear All
            </button>
          </div>

          <div className="filter-body">
            <div className="filter-group">
              <label>
                <i className="bi bi-calendar-event"></i>
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>
                <i className="bi bi-calendar-check"></i>
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <button
                className="filter-apply-btn"
                onClick={handleApplyFilter}
                disabled={isLoading}
                style={{ background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)" }}
              >
                <i className="bi bi-search"></i>
                Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">
          {isLoading ? (
            <div className="table-loading">
              <SkeletonTable rowsCount={8} />
            </div>
          ) : rows.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <i className="bi bi-chat-square-text"></i>
              </div>
              <h3>No Follow-ups Found</h3>
              <p>
                {fromDate || toDate || status
                  ? "Try adjusting your filters to find records"
                  : "There are no pending follow-ups at the moment"}
              </p>
              {(fromDate || toDate || status) && (
                <button className="empty-clear-btn" onClick={handleClearFilter}>
                  <i className="bi bi-arrow-counterclockwise"></i>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-calendar3"></i>
                          Planned Date
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-building"></i>
                          Firm Name
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-telephone"></i>
                          Contact
                        </div>
                      </th>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-geo-alt"></i>
                          Locality
                        </div>
                      </th>
                      <th className="th-action">
                        <div className="th-content">
                          <i className="bi bi-gear"></i>
                          Action
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} style={{ animationDelay: `${i * 0.03}s` }}>
                        <td>
                          <div className="date-cell" style={{ color: "#ec4899" }}>
                            <i className="bi bi-calendar-date"></i>
                            {formatDate(r.plannedDate)}
                          </div>
                        </td>
                        <td>
                          <div className="firm-cell">
                            <span className="firm-name">{r.colB}</span>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            <a href={`tel:${r.colC}`} className="contact-link">
                              <i className="bi bi-telephone-fill"></i>
                              {r.colC || "-"}
                            </a>
                          </div>
                        </td>
                        <td>
                          <div className="locality-cell">
                            <i className="bi bi-pin-map"></i>
                            {r.colD || "-"}
                          </div>
                        </td>
                        <td className="action-cell">
                          <button
                            className="action-btn"
                            onClick={() =>
                              setSelectedRow({
                                ...r,
                                rowIndex: r.rowIndex,
                              })
                            }
                            style={{ background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)" }}
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
                  <i className="bi bi-info-circle" style={{ color: "#ec4899" }}></i>
                  Showing <strong>{rows.length}</strong> record{rows.length !== 1 ? "s" : ""}
                </div>
                <button className="refresh-btn" onClick={() => refetch()}>
                  <i className="bi bi-arrow-clockwise"></i>
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>

        {/* Followup Modal */}
        {selectedRow && (
          <FollowupModal
            row={selectedRow}
            onClose={() => setSelectedRow(null)}
            onSuccess={() => refetch()}
          />
        )}
      </div>
    </Layout>
  );
}

export default Followup;