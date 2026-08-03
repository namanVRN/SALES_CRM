import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/styles/CPOutgoing.css";

function CPOutgoing() {
  const navigate = useNavigate();

  const steps = [
    {
      title: "Call to Broker",
      icon: "bi-telephone-inbound-fill",
      description: "Initiate and track broker calls with detailed logging",
      path: "/process/call-to-broker",
      color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      step: 1,
    },
    // {
    //   title: "Follow-up",
    //   icon: "bi-chat-dots-fill",
    //   description: "Manage follow-up conversations and schedule reminders",
    //   path: "/process/followup",
    //   color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    //   step: 2,
    // },
    {
      title: "Meetings & Closure",
      icon: "bi-people-fill",
      description: "Schedule meetings, negotiate and close deals successfully",
      path: "/process/meetings/overview",
      color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      step: 3,
    },
  ];

  return (
    <Layout
      breadcrumbs={[
        { name: "Channel Partner", path: "/channel-partner" },
        { name: "CP Outgoing FMS", path: "/channel-partner/cp-outgoing" },
      ]}
    >
      <div className="process-container">
        {/* Background Elements */}
        <div className="process-bg">
          <div className="process-shape process-shape-1"></div>
          <div className="process-shape process-shape-2"></div>
          <div className="process-shape process-shape-3"></div>
        </div>

        {/* Header Section */}
        <div className="process-header">
          <div className="process-header-icon">
            <i className="bi bi-arrow-up-right-circle-fill"></i>
          </div>
          <div className="process-header-content">
            <h1>CP Outgoing FMS</h1>
            <p>Channel Partner Outgoing Flow Management System</p>
          </div>
          <div className="process-header-badge">
            <span>{steps.length} Steps</span>
          </div>
        </div>

        {/* Process Flow Indicator  */}
{/*         
         <div className="process-flow-indicator">
          {steps.map((step, index) => (
            <div key={index} className="flow-step">
              <div
                className="flow-number"
                style={{ background: step.color }}
              >
                {step.step}
              </div>
              <span className="flow-title">{step.title}</span>
              {index < steps.length - 1 && (
                <div className="flow-connector">
                  <i className="bi bi-chevron-right"></i>
                </div>
              )}
            </div>
          ))}
        </div> */}

        {/* Cards Grid */}
        <div className="process-cards-grid">
          {steps.map((step, index) => (
            <div
              key={index}
              className="process-card"
              onClick={() => navigate(step.path)}
              style={{ animationDelay: `${index * 0.15}s` }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(step.path);
                }
              }}
            >
              {/* Step Number Badge */}
              <div className="step-badge" style={{ background: step.color }}>
                Step {step.step}
              </div>

              {/* Card Glow */}
              <div
                className="process-card-glow"
                style={{ background: step.color }}
              ></div>

              {/* Card Content */}
              <div className="process-card-content">
                {/* Icon */}
                <div
                  className="process-card-icon"
                  style={{ background: step.color }}
                >
                  <i className={`bi ${step.icon}`}></i>
                </div>

                {/* Text */}
                <h3>{step.title}</h3>
                <p>{step.description}</p>

                {/* Button */}
                <button
                  className="process-card-btn"
                  style={{
                    background: step.color,
                  }}
                >
                  <span>Open</span>
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>

              {/* Hover Border */}
              <div
                className="process-card-border"
                style={{ background: step.color }}
              ></div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        {/* <div className="process-footer">
          <div className="process-footer-item">
            <i className="bi bi-arrow-repeat"></i>
            <span>Follow the steps in sequence for best results</span>
          </div>
        </div> */}
      </div>
    </Layout>
  );
}

export default CPOutgoing;