import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { searchLeads } from "../services/NbdApi";
import "../assets/styles/Layout.css";

function Layout({ children, breadcrumbs }) {
  const navigate = useNavigate();
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debounced search
  const handleSearch = (value) => {
    setSearchTerm(value);
    setSearchError("");

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmedValue = value.trim();

    // ✅ Minimum 2 characters required
    if (trimmedValue.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    // Show dropdown and loading state
    setIsSearching(true);
    setShowSearchResults(true);

    // Debounce search - wait 400ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchLeads(trimmedValue);
        
        if (response.success) {
          setSearchResults(response.data || []);
          setSearchError("");
        } else {
          setSearchError(response.error || "Search failed");
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search error:", error);
        
        // Handle different error types
        if (error.response?.status === 400) {
          setSearchError("Please enter at least 2 characters");
        } else if (error.response?.status === 500) {
          setSearchError("Server error. Please try again later.");
        } else if (error.code === "ERR_NETWORK") {
          setSearchError("Network error. Check your connection.");
        } else {
          setSearchError("Failed to search. Please try again.");
        }
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchError("");
    setIsSearching(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Get step badge style
  const getStepBadgeStyle = (step) => {
    const colors = {
      1: { bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
      2: { bg: "#fce7f3", color: "#be185d", border: "#f9a8d4" },
      3: { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
      4: { bg: "#ede9fe", color: "#6d28d9", border: "#c4b5fd" },
      5: { bg: "#d1fae5", color: "#047857", border: "#6ee7b7" },
      0: { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db" },
    };
    return colors[step] || colors[0];
  };

  // ✅ Smart routing — based on sheetType (Direct/CP) + currentStep + special states
const handleResultClick = (result) => {
  let route = "/dashboard"; // fallback

  // ============================================
  // DIRECT (NBD) PIPELINE Routes
  // ============================================
  if (result.sheetType === "Direct") {
    const status = (result.stepStatus || "").toLowerCase().trim();

    // Special case: Call Not Picked → CNP page
    if (status === "call not picked") {
      route = "/nbd-in/cnp";
    } else {
      const nbdRoutes = {
        1: "/nbd-in/NBD_IN", // Step 1 Follow-up
        2: "/nbd-in/field-visit", // Step 2 Field Visit
        3: "/nbd-in/followup", // Step 3 After Field Visit
        4: "/nbd-in/meeting", // Step 4 Meeting
        5: "/nbd-in/booking", // Step 5 Booking
        0: "/nbd-in", // Completed/Closed
      };
      route = nbdRoutes[result.currentStep] || "/nbd-in";
    }
  }

  // ============================================
  // CHANNEL PARTNER (CP) PIPELINE Routes
  // ============================================
  else if (result.sheetType === "Channel Partner") {
    // Detect Can/Cannot Contact based on Column AM (if available in result)
    const canContact = result.canContact !== "No"; // default Can Contact

    const cpCanRoutes = {
      1: "/cp/can-contact/step-one",
      2: "/cp/can-contact/step-two",
      3: "/cp/can-contact/step-three",
      4: "/cp/can-contact/step-four",
      5: "/cp/can-contact/step-five",
      0: "/cp",
    };

    const cpCannotRoutes = {
      1: "/cp/cannot-contact/cp-step-one",
      2: "/cp/cannot-contact/cp-step-two",
      3: "/cp/cannot-contact/cp-step-three",
      4: "/cp/cannot-contact/cp-step-four",
      5: "/cp/cannot-contact/cp-step-five",
      0: "/cp",
    };

    const cpRoutes = canContact ? cpCanRoutes : cpCannotRoutes;
    route = cpRoutes[result.currentStep] || "/cp";
  }

  // ✅ Pass uniqueId in URL state for highlighting on target page
  clearSearch();
  navigate(route, {
    state: {
      highlightLeadId: result.uniqueId,
      fromSearch: true,
    },
  });
};

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="main-header">
        <div className="header-inner">
          {/* Logo */}
          <Link to="/dashboard" className="header-logo">
            <div className="logo-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="logo-text">
              <span className="logo-title">VRN INC.</span>
              <span className="logo-subtitle">Sales CRM</span>
            </div>
          </Link>

          {/* Universal Search Box */}
          <div className="universal-search-container" ref={searchRef}>
            <div className="search-input-wrapper">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="universal-search-input"
                placeholder="Search lead by name, contact, or ID (min 2 chars)..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (searchTerm.trim().length >= 2) {
                    setShowSearchResults(true);
                  }
                }}
              />
              {searchTerm && (
                <button className="search-clear-btn" onClick={clearSearch} type="button">
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
              {isSearching && (
                <div className="search-spinner">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchTerm.trim().length >= 2 && (
              <div className="search-results-dropdown">
                {isSearching ? (
                  <div className="search-loading">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <span>Searching...</span>
                  </div>
                ) : searchError ? (
                  <div className="search-error">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{searchError}</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="search-no-results">
                    <i className="bi bi-inbox"></i>
                    <span>No leads found for "{searchTerm}"</span>
                  </div>
                ) : (
                  <>
                    <div className="search-results-header">
                      <span>
                        <i className="bi bi-people"></i> Found {searchResults.length} lead
                        {searchResults.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="search-results-list">
                      {searchResults.map((result, index) => {
                        const stepStyle = getStepBadgeStyle(result.currentStep);
                        return (
                          <div
                            key={`${result.sheetType}-${result.rowIndex}-${index}`}
                            className="search-result-item"
                            onClick={() => handleResultClick(result)}
                          >
                            <div className="result-main">
                              <div className="result-header">
                                <span className="result-name">{result.customerName || "N/A"}</span>
                                <span
                                  className="result-source-badge"
                                  style={{
                                    background: result.sheetType === "Direct" ? "#dbeafe" : "#fef3c7",
                                    color: result.sheetType === "Direct" ? "#1d4ed8" : "#b45309",
                                  }}
                                >
                                  {result.sheetType}
                                </span>
                              </div>
                              <div className="result-details">
                                <span className="result-contact">
                                  <i className="bi bi-telephone"></i>
                                  {result.customerContact || "N/A"}
                                </span>
                                <span className="result-id">
                                  <i className="bi bi-hash"></i>
                                  {result.uniqueId || "N/A"}
                                </span>
                              </div>
                            </div>

                            <div className="result-step-info">
                              <div
                                className="step-badge"
                                style={{
                                  background: stepStyle.bg,
                                  color: stepStyle.color,
                                  border: `1px solid ${stepStyle.border}`,
                                }}
                              >
                                <i className={`bi ${result.stepIcon}`}></i>
                                <span className="step-name">{result.stepName}</span>
                              </div>
                              {result.stepPlannedDate && (
                                <span className="step-date">
                                  <i className="bi bi-calendar3"></i>
                                  {result.stepPlannedDate.split(" ")[0]}
                                </span>
                              )}
                              <span
                                className="step-status"
                                style={{
                                  color: stepStyle.color,
                                }}
                              >
                                {result.stepStatus}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="header-right">
            {/* Quick Actions */}
            <div className="header-actions">
              <button className="action-btn" title="Refresh" onClick={() => window.location.reload()}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
              <button className="action-btn" title="Home" onClick={() => navigate("/dashboard")}>
                <i className="bi bi-house-door"></i>
              </button>
            </div>

            {/* User Menu */}
            {user && (
              <div className="user-menu-container">
                <button
                  className="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div className="user-info">
                    <span className="user-email">{user.email}</span>
                    <span className="user-role">Admin</span>
                  </div>
                  <i className={`bi bi-chevron-down menu-arrow ${showUserMenu ? "rotate" : ""}`}></i>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div className="menu-backdrop" onClick={() => setShowUserMenu(false)}></div>
                    <div className="user-dropdown" style={{ padding: "12px 14px" }}>
                      <div className="dropdown-header">
                        <div className="dropdown-avatar">
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <div className="dropdown-user-info">
                          <span className="dropdown-email">{user.email}</span>
                          <span className="dropdown-role">Administrator</span>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right"></i>
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumb-nav">
          <div className="breadcrumb-inner">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <Link to="/dashboard" className="breadcrumb-link home">
                  <i className="bi bi-house-door-fill"></i>
                  <span>Home</span>
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="breadcrumb-item">
                  <i className="bi bi-chevron-right breadcrumb-separator"></i>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="breadcrumb-current">{crumb.name}</span>
                  ) : (
                    <Link to={crumb.path} className="breadcrumb-link">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">{children}</main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span>© 2026 VRN INC. All rights reserved.</span>
          </div>
          <div className="footer-right">
            <span className="footer-version">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;