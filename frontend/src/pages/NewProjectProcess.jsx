import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/styles/Process.css";

function NewProjectProcess() {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Upload Documents",
      description: "Upload and manage project documents securely",
      icon: "bi-cloud-arrow-up-fill",
      color: "#10b981",
      bgColor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      actionUrl: "https://script.google.com/macros/s/AKfycbwkLbsEiYtLfKcINNMDrkwTwnDrX5czUjcXsEuWqssJc-5JNNMyNO2teUIrjnWL-PY/exec",
      isExternal: true,
      step: 1,
    },
    {
      title: "Coming Soon",
      description: "New features are being developed",
      icon: "bi-chat-dots-fill",
      color: "#6366f1",
      bgColor: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      step: 2,
      comingSoon: true,
    },
    {
      title: "Coming Soon",
      description: "Stay tuned for more updates",
      icon: "bi-people-fill",
      color: "#f59e0b",
      bgColor: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      step: 3,
      comingSoon: true,
    },
  ];

  const handleStepClick = (step) => {
    if (step.comingSoon) return;
    if (step.actionUrl) {
      window.open(step.actionUrl, "_blank", "noopener,noreferrer");
    } else if (step.path) {
      navigate(step.path);
    }
  };

  return (
    <Layout
      breadcrumbs={[
        { name: "Dashboard", path: "/dashboard" },
        { name: "New Project Development FMS", path: "/new-project-development" },
      ]}
    >
      <div className="npd-container">
        {/* Background Elements */}
        <div className="npd-bg">
          <div className="npd-shape npd-shape-1"></div>
          <div className="npd-shape npd-shape-2"></div>
          <div className="npd-shape npd-shape-3"></div>
        </div>

        {/* Hero Section */}
        <div className="npd-hero">
          <div className="npd-hero-content">
            <div className="npd-hero-badge">
              <i className="bi bi-building-fill"></i>
              <span>FMS Process</span>
            </div>
            <h1>New Project Development</h1>
          </div>
          <div className="npd-hero-visual">
            <div className="visual-container">
              <div className="visual-ring visual-ring-1"></div>
              <div className="visual-ring visual-ring-2"></div>
              <div className="visual-center">
                <i className="bi bi-building-fill"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {/* <div className="npd-progress">
          {steps.map((step, index) => (
            <div key={index} className="progress-item">
              <div 
                className="progress-dot" 
                style={{ background: step.comingSoon ? "#94a3b8" : step.bgColor }}
              >
                {step.step}
              </div>
              <span className="progress-label" style={{ color: step.comingSoon ? "#94a3b8" : step.color }}>
                {step.title}
              </span>
              {index < steps.length - 1 && <div className="progress-connector"></div>}
            </div>
          ))}
        </div> */}

        {/* Cards Grid */}
        <div className="npd-cards-grid">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`npd-card ${step.comingSoon ? "disabled" : ""}`}
              onClick={() => handleStepClick(step)}
              style={{ animationDelay: `${index * 0.15}s`, "--card-color": step.color }}
              role="button"
              tabIndex={step.comingSoon ? -1 : 0}
              onKeyDown={(e) => {
                if (!step.comingSoon && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleStepClick(step);
                }
              }}
            >
              {/* Step Badge */}
              <div 
                className="npd-step-badge" 
                style={{ background: step.comingSoon ? "#94a3b8" : step.bgColor }}
              >
                {step.comingSoon ? "Soon" : `Step ${step.step}`}
              </div>

              {/* External Link Indicator */}
              {step.isExternal && !step.comingSoon && (
                <div className="npd-external-badge">
                  <i className="bi bi-box-arrow-up-right"></i>
                </div>
              )}

              {/* Card Icon */}
              <div className="npd-card-icon-wrapper">
                <div 
                  className="npd-card-icon-bg" 
                  style={{ background: step.comingSoon ? "#94a3b8" : step.bgColor }}
                ></div>
                <div 
                  className="npd-card-icon" 
                  style={{ background: step.comingSoon ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" : step.bgColor }}
                >
                  <i className={`bi ${step.icon}`}></i>
                </div>
              </div>

              {/* Card Content */}
              <div className="npd-card-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>

              {/* Card Button */}
              <button 
                className="npd-card-btn" 
                style={{ background: step.comingSoon ? "#e2e8f0" : step.bgColor }}
                disabled={step.comingSoon}
              >
                <span>{step.comingSoon ? "Coming Soon" : step.isExternal ? "Open" : "View"}</span>
                {!step.comingSoon && (
                  <i className={`bi ${step.isExternal ? "bi-box-arrow-up-right" : "bi-arrow-right"}`}></i>
                )}
              </button>

              {/* Coming Soon Overlay */}
              {step.comingSoon && (
                <div className="npd-coming-soon-overlay">
                  <div className="overlay-content">
                    <i className="bi bi-hourglass-split"></i>
                    <span>Coming Soon</span>
                  </div>
                </div>
              )}

              {/* Hover Gradient */}
              <div className="npd-card-gradient" style={{ background: step.bgColor }}></div>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        {/* <div className="npd-footer">
          <div className="npd-footer-tip">
            <i className="bi bi-info-circle-fill"></i>
            <span>More features will be added soon. Stay tuned!</span>
          </div>
        </div> */}
      </div>
    </Layout>
  );
}

export default NewProjectProcess;