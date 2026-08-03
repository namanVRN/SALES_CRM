import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../assets/styles/Process.css";

function FSRPage() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Step 1: Field Visit",
      description: "Schedule and track field visits",
      icon: "bi-geo-alt-fill",
      color: "#ec4899",
      bgColor: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
      path: "/fsr/field-visit",
      step: 1,
    },
    {
      title: "Step 2: Follow-up",
      description: "Post field visit follow-up activities",
      icon: "bi-chat-dots-fill",
      color: "#f59e0b",
      bgColor: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      path: "/fsr/followup",
      step: 2,
    },
    {
      title: "Step 3: Meeting",
      description: "Schedule and manage meetings with leads",
      icon: "bi-rocket-takeoff-fill",
      color: "#8b5cf6",
      bgColor: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
      path: "/fsr/meeting",
      step: 3,
    },
  ];

  return (
    <Layout breadcrumbs={[{ name: "FSR", path: "/fsr" }]}>
      <div className="nbdin-container">
        <div className="nbdin-bg">
          <div className="nbdin-shape nbdin-shape-1"></div>
          <div className="nbdin-shape nbdin-shape-2"></div>
          <div className="nbdin-shape nbdin-shape-3"></div>
        </div>

        {/* <div className="nbdin-hero">
          <div className="nbdin-hero-content">
            <div className="nbdin-hero-badge">
              <i className="bi bi-diagram-3-fill"></i>
              <span>FSR Workflow</span>
            </div>
            <h1>Field Sales Representative</h1>
          </div>
          <div className="nbdin-hero-visual">
            <div className="hero-icon-stack">
              <div className="stack-item stack-1"><i className="bi bi-geo-alt"></i></div>
              <div className="stack-item stack-2"><i className="bi bi-telephone"></i></div>
              <div className="stack-item stack-3"><i className="bi bi-calendar-check"></i></div>
            </div>
          </div>
        </div> */}

        <div className="nbdin-cards-grid">
          {cards.map((card, index) => (
            <div
              key={index}
              className="nbdin-card"
              onClick={() => navigate(card.path)}
              style={{ animationDelay: `${index * 0.1}s`, "--card-color": card.color }}
            >
              <div className="nbdin-step-badge" style={{ background: card.bgColor }}>
                Step {card.step}
              </div>
              <div className="nbdin-card-icon-wrapper">
                <div className="nbdin-card-icon-bg" style={{ background: card.bgColor }}></div>
                <div className="nbdin-card-icon" style={{ background: card.bgColor }}>
                  <i className={`bi ${card.icon}`}></i>
                </div>
              </div>
              <div className="nbdin-card-content">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <button className="nbdin-card-btn" style={{ background: card.bgColor }}>
                <span>View</span>
                <i className="bi bi-arrow-right"></i>
              </button>
              <div className="nbdin-card-gradient" style={{ background: card.bgColor }}></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default FSRPage;