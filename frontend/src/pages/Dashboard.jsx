import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import "../assets/styles/Dashboard.css";

function Dashboard() {
  const { user, hasModuleAccess } = useAuth();

  const allCards = [
    {
      id: "channel-partner",
      title: "Channel Partner",
      icon: "bi-people-fill",
      path: "/channel-partner",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      description: "Manage channel partners & leads",
      module: null,
    },
    {
      id: "nbd-unit",
      title: "NBD Unit",
      icon: "bi-diagram-3-fill",
      path: "/nbd-in",
      color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      description: "New business development tracking",
      module: "nbd",
    },
    {
      id: "cp-nbd-unit",
      title: "CP-NBD Unit",
      icon: "bi-briefcase-fill",
      path: "/cp",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      description: "Channel Partner NBD management",
      module: "cp",
    },
    // ✅ NEW: FSR card — BDM4, BDM5 + Admin
    {
      id: "fsr-unit",
      title: "FSR",
      icon: "bi-geo-alt-fill",
      path: "/fsr",
      color: "linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)",
      description: "Field Sales Representative workflow",
      module: "fsr",
    },
  ];

  const visibleCards = allCards.filter((card) => {
    if (!card.module) return true;
    return hasModuleAccess(card.module);
  });

  return (
    <Layout breadcrumbs={[]}>
      <div className="dashboard-container">
        <div className="dashboard-bg">
          <div className="bg-shape shape-1"></div>
          <div className="bg-shape shape-2"></div>
          <div className="bg-shape shape-3"></div>
        </div>

        <div className="welcome-section">
          <div className="welcome-content">
            <div className="welcome-avatar">
              <i className="bi bi-person-circle"></i>
            </div>
            <div className="welcome-text">
              <h1>Welcome Back, {user?.name || "User"}!</h1>
              <p>
                <i className="bi bi-envelope-fill"></i>
                {user?.email}
              </p>
              <div className="user-role-badge">
                <i className="bi bi-shield-check-fill"></i>
                <span>
                  {user?.role === "admin"
                    ? "Administrator"
                    : user?.role?.toUpperCase()}
                </span>
                {user?.assignedModule && user?.assignedModule !== "all" && (
                  <span className="module-tag">
                    • {user.assignedModule.toUpperCase()} Module
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="welcome-stats">
            <div className="stat-item">
              <span className="stat-number">{visibleCards.length}</span>
              <span className="stat-label">Modules</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">
                <i className="bi bi-circle-fill text-success"></i>
              </span>
              <span className="stat-label">Active</span>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2>
            <i className="bi bi-grid-fill"></i>
            Quick Access
          </h2>
          <p>Select a module to get started</p>
        </div>

        {visibleCards.length > 0 ? (
          <div className="cards-grid">
            {visibleCards.map((card, index) => (
              <Link
                to={card.path}
                key={card.id}
                className="dashboard-card-link"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="dashboard-card">
                  <div
                    className="card-icon-wrapper"
                    style={{ background: card.color }}
                  >
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                  <div className="card-content">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </div>
                  <div className="card-arrow">
                    <i className="bi bi-arrow-right-circle-fill"></i>
                  </div>
                  <div
                    className="card-hover-bg"
                    style={{ background: card.color }}
                  ></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-access-container">
            <div className="no-access-card">
              <div className="no-access-icon">
                <i className="bi bi-lock-fill"></i>
              </div>
              <h3>No Modules Assigned</h3>
              <p>You don't have access to any modules yet.</p>
              <p className="contact-admin">
                Please contact your administrator for access.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;