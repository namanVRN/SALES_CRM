import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/styles/Process.css";

function MeetingsOverview() {
  const navigate = useNavigate();

  const cards = [
    // {
    //   title: "Full Kitting",
    //   description: "Prepare and verify complete kit details for meetings",
    //   icon: "bi-box-seam-fill",
    //   path: "/process/meetings/full-kitting",
    //   color: "#14b8a6",
    //   bgColor: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
    //   step: 1,
    // },
    {
      title: "Meetings",
      description: "Track scheduled and completed meetings with partners",
      icon: "bi-people-fill",
      path: "/process/meetings/Meetings",
      color: "#6366f1",
      bgColor: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      step: 2,
    },
    {
      title: "Agreement",
      description: "Manage signed agreements, contracts & terms",
      icon: "bi-file-earmark-check-fill",
      path: "/process/meetings/agreement",
      color: "#f59e0b",
      bgColor: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      step: 3,
    },
  ];

  return (
    <Layout
      breadcrumbs={[
        { name: "CP Outgoing", path: "/channel-partner/cp-outgoing/" },
        { name: "Meetings & Closure", path: "/process/meetings/overview" },
      ]}
    >
      <div className="meetings-container">
        {/* Background Elements */}
        <div className="meetings-bg">
          <div className="meetings-shape meetings-shape-1"></div>
          <div className="meetings-shape meetings-shape-2"></div>
          <div className="meetings-shape meetings-shape-3"></div>
        </div>

        {/* Hero Section */}
        <div className="meetings-hero">
          <div className="meetings-hero-content">
            <div className="meetings-hero-badge">
              <i className="bi bi-calendar-check-fill"></i>
              <span>Workflow</span>
            </div>
            <h1>Meetings & Closure</h1>
          </div>
          <div className="meetings-hero-visual">
            <div className="hero-rings">
              <div className="ring ring-1"></div>
              <div className="ring ring-2"></div>
              <div className="ring ring-3"></div>
            </div>
            <div className="hero-center-icon">
              <i className="bi bi-people-fill"></i>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        {/* <div className="meetings-progress">
          {cards.map((card, index) => (
            <div key={index} className="progress-step">
              <div 
                className="progress-number"
                style={{ background: card.bgColor }}
              >
                {card.step}
              </div>
              <span className="progress-title">{card.title}</span>
              {index < cards.length - 1 && (
                <div className="progress-line">
                  <div className="line-inner"></div>
                </div>
              )}
            </div>
          ))}
        </div> */}

        {/* Cards Grid */}
        <div className="meetings-cards-grid">
          {cards.map((card, index) => (
            <div
              key={index}
              className="meetings-card"
              onClick={() => navigate(card.path)}
              style={{ animationDelay: `${index * 0.15}s`, "--card-color": card.color }}
            >
              {/* Step Badge */}
              <div className="card-step-badge" style={{ background: card.bgColor }}>
                Step {card.step}
              </div>

              {/* Card Icon */}
              <div className="card-icon-container">
                <div className="card-icon-bg" style={{ background: card.bgColor }}></div>
                <div className="card-icon" style={{ background: card.bgColor }}>
                  <i className={`bi ${card.icon}`}></i>
                </div>
              </div>

              {/* Card Content */}
              <div className="card-text-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>

              {/* Card Button */}
              <button className="card-btn" style={{ background: card.bgColor }}>
                <span>Open</span>
                <i className="bi bi-arrow-right"></i>
              </button>

              {/* Hover Gradient */}
              <div className="card-gradient" style={{ background: card.bgColor }}></div>
            </div>
          ))}
        </div>

        {/* Info Footer */}
        {/* <div className="meetings-footer">
          <div className="footer-tip">
            <i className="bi bi-lightbulb-fill"></i>
            <span>Complete each step to successfully onboard a channel partner</span>
          </div>
        </div> */}
      </div>
    </Layout>
  );
}

export default MeetingsOverview;