import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFullKittingData,
  submitFullKittingAction,
} from "../services/fmsNewApi";
import Layout from "../components/Layout";
import SkeletonTable from "../components/SkeletonTable";
import { toast } from "react-toastify";
import "../assets/styles/TablePages.css";
import "../assets/styles/ActionModal.css";

function FullKitting() {
  const queryClient = useQueryClient();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    status: "",
    pptPrint: "",
    slabStructure: "",
    mou: "",
    remark: "",
  });

  const {
    data: rows = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["fullKitting", fromDate, toDate, status],
    queryFn: () => fetchFullKittingData({ fromDate, toDate, status }),
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
  });

  const handleAction = (row) => {
    setSelectedRow(row);
    setFormData({
      status: "",
      pptPrint: "",
      slabStructure: "",
      mou: "",
    });
    setShowModal(true);
  };

  const handleModalSubmit = () => {
    if (!formData.status) {
      toast.warning("Status is required");
      return;
    }

    const payload = {
      rowNumber: selectedRow.rowNumber,
      status: formData.status,
      pptPrint: formData.pptPrint,
      slabStructure: formData.slabStructure, // (mou same as slabStructure)
      remark: formData.remark,
    };

    updateMutation.mutate(payload);
  };

  const updateMutation = useMutation({
    mutationFn: submitFullKittingAction,
    onSuccess: () => {
      toast.success("Full Kitting updated successfully");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["fullKitting"] });
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update. Please try again.");
    },
  });

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
        { name: "Meetings", path: "/process/meetings/overview" },
        { name: "Full Kitting", path: "/process/meetings/full-kitting" },
      ]}
    >
      <div className="table-page-container">
        {/* Background Elements */}
        <div className="table-page-bg">
          <div
            className="table-bg-shape table-bg-shape-1"
            style={{ background: "linear-gradient(135deg, #14b8a6, #0d9488)" }}
          ></div>
          <div
            className="table-bg-shape table-bg-shape-2"
            style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
          ></div>
        </div>

        {/* Header Section */}
        <div
          className="table-page-header"
          style={{
            background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
          }}
        >
          <div className="header-content">
            <div className="header-icon">
              <i className="bi bi-box-seam-fill"></i>
            </div>
            <div className="header-text">
              <h1>Full Kitting</h1>
              <p>Prepare and verify complete kit details for meetings</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{rows.length}</span>
              <span className="stat-label">Pending</span>
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
                <i className="bi bi-box-seam"></i>
              </div>
              <h3>No Records Found</h3>
              <p>
                {fromDate || toDate || status
                  ? "No Full Kitting records found with selected filters"
                  : "No pending Full Kitting records at the moment"}
              </p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>
                        <div className="th-content">
                          <i className="bi bi-hash"></i>
                          Unique ID
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
                      <tr
                        key={r.rowNumber}
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <td>
                          <div className="id-cell">
                            <span className="id-badge">{r.uniqueId}</span>
                          </div>
                        </td>
                        <td>
                          <div className="firm-cell">
                            <span className="firm-name">{r.firmName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            <a
                              href={`tel:${r.contact}`}
                              className="contact-link"
                            >
                              <i className="bi bi-telephone-fill"></i>
                              {r.contact || "-"}
                            </a>
                          </div>
                        </td>
                        <td>
                          <div className="locality-cell">
                            <i className="bi bi-pin-map"></i>
                            {r.locality || "-"}
                          </div>
                        </td>
                        <td className="action-cell">
                          <button
                            className="action-btn"
                            onClick={() => handleAction(r)}
                            style={{
                              background:
                                "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
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
                    style={{ color: "#14b8a6" }}
                  ></i>
                  Showing <strong>{rows.length}</strong> record
                  {rows.length !== 1 ? "s" : ""}
                </div>
                <button className="refresh-btn" onClick={() => refetch()}>
                  <i className="bi bi-arrow-clockwise"></i>
                  Refresh
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="modal-header-custom"
                style={{
                  background:
                    "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                }}
              >
                <div className="modal-header-content">
                  <div className="modal-icon">
                    <i className="bi bi-box-seam-fill"></i>
                  </div>
                  <div className="modal-header-text">
                    <h2>Full Kitting Action</h2>
                    <div className="modal-subtitle">
                      <span className="firm-badge">
                        <i className="bi bi-building"></i>
                        {selectedRow?.firmName || "Unknown Firm"}
                      </span>
                      <span className="contact-badge">
                        <i className="bi bi-hash"></i>
                        Row {selectedRow?.rowNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body-custom">
                <form>
                  {/* Status Selection */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-check-circle-fill"
                        style={{ color: "#14b8a6" }}
                      ></i>
                      Status <span className="required">*</span>
                    </label>
                    <div className="toggle-group">
                      <div
                        className={`toggle-option ${formData.status === "Done" ? "active yes" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, status: "Done" })
                        }
                      >
                        <i className="bi bi-check-lg"></i>
                        Done
                      </div>
                      <div
                        className={`toggle-option ${formData.status === "Not Done" ? "active no" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, status: "Not Done" })
                        }
                      >
                        <i className="bi bi-x-lg"></i>
                        Not Done
                      </div>
                    </div>
                  </div>

                  {/* PPT Print */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-file-earmark-slides-fill"
                        style={{ color: "#14b8a6" }}
                      ></i>
                      PPT Print
                    </label>
                    <div className="toggle-group">
                      <div
                        className={`toggle-option ${formData.pptPrint === "Yes" ? "active yes" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, pptPrint: "Yes" })
                        }
                      >
                        <i className="bi bi-check-lg"></i>
                        Yes
                      </div>
                      <div
                        className={`toggle-option ${formData.pptPrint === "No" ? "active no" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, pptPrint: "No" })
                        }
                      >
                        <i className="bi bi-x-lg"></i>
                        No
                      </div>
                    </div>
                  </div>

                  {/* Slab Structure */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-layers-fill"
                        style={{ color: "#14b8a6" }}
                      ></i>
                      Slab Structure
                    </label>
                    <div className="toggle-group">
                      <div
                        className={`toggle-option ${formData.slabStructure === "Yes" ? "active yes" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, slabStructure: "Yes" })
                        }
                      >
                        <i className="bi bi-check-lg"></i>
                        Yes
                      </div>
                      <div
                        className={`toggle-option ${formData.slabStructure === "No" ? "active no" : ""}`}
                        onClick={() =>
                          setFormData({ ...formData, slabStructure: "No" })
                        }
                      >
                        <i className="bi bi-x-lg"></i>
                        No
                      </div>
                    </div>
                  </div>

                  {/* MoU */}
                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-file-earmark-text-fill"
                        style={{ color: "#14b8a6" }}
                      ></i>
                      MoU
                    </label>
                    <div className="toggle-group">
                      <div
                        className={`toggle-option ${formData.mou === "Yes" ? "active yes" : ""}`}
                        onClick={() => setFormData({ ...formData, mou: "Yes" })}
                      >
                        <i className="bi bi-check-lg"></i>
                        Yes
                      </div>
                      <div
                        className={`toggle-option ${formData.mou === "No" ? "active no" : ""}`}
                        onClick={() => setFormData({ ...formData, mou: "No" })}
                      >
                        <i className="bi bi-x-lg"></i>
                        No
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <label className="form-label-custom">
                      <i
                        className="bi bi-chat-square-text-fill"
                        style={{ color: "#14b8a6" }}
                      ></i>
                      Remark
                    </label>
                    <div className="textarea-wrapper">
                      <textarea
                        className="form-textarea-custom"
                        placeholder="Add any remarks or notes..."
                        value={formData.remark}
                        onChange={(e) =>
                          setFormData({ ...formData, remark: e.target.value })
                        }
                        rows={3}
                      ></textarea>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer-custom">
                <button
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  <i className="bi bi-x-circle"></i>
                  Close
                </button>
                <button
                  className="btn-submit"
                  onClick={handleModalSubmit}
                  disabled={updateMutation.isPending || !formData.status}
                  style={{
                    background:
                      "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  }}
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="spinner"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill"></i>
                      Save Changes
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

export default FullKitting;
