import React from "react";
import { useNavigate } from "react-router-dom";
import "./Match.css";

const Match = () => {
  const navigate = useNavigate();

  return (
    <div className="match-page">
      <div className="match-header">
        <button className="back-btn" onClick={() => navigate("/profile")} aria-label="Back to profile">←</button>
        <div className="headings">
          <h1 className="title">Connect & Learn</h1>
          <p className="subtitle">Join SkillTalk groups to collaborate in real‑time with peers.</p>
        </div>
      </div>

      <div className="match-hero">
        <div className="hero-visual">
          <span className="bubble">🎥</span>
          <span className="bubble">🎙️</span>
          <span className="bubble">🖥️</span>
        </div>
        <div className="hero-actions">
          <button className="btn primary" onClick={() => navigate("/match/join")}>
            🔍 Join Groups
          </button>
          <button className="btn secondary" onClick={() => navigate("/match/create")}>
            ➕ Create Group
          </button>
        </div>
        <div className="topic-chips" role="list">
          {[
            "AI/ML",
            "Frontend",
            "Backend",
            "DevOps",
            "Data",
            "Cloud",
          ].map((t) => (
            <button key={t} className="chip" role="listitem" onClick={() => navigate("/match/join")}>{t}</button>
          ))}
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <div className="info-emoji">🔊</div>
          <h3>Voice & Video</h3>
          <p>Talk live with teammates and mentors.</p>
        </div>
        <div className="info-card">
          <div className="info-emoji">🖥️</div>
          <h3>Screen Share</h3>
          <p>Walk through code and designs together.</p>
        </div>
        <div className="info-card">
          <div className="info-emoji">⏺️</div>
          <h3>Recording</h3>
          <p>Save sessions for later review.</p>
        </div>
      </div>

      <div className="spacer" />
    </div>
  );
};

export default Match;

