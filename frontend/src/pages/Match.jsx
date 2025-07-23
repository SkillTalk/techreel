import React from "react";
import { useNavigate } from "react-router-dom";
import "./Match.css";

const Match = () => {
  const navigate = useNavigate();

  return (
    <div className="match-container">
      <button className="back-button" onClick={() => navigate("/profile")}>
        ← Back to Profile
      </button>

      <div className="match-content">
        <h2 className="match-title">🔗 Group Match</h2>
        <p className="match-description">
          Join like-minded users in topic-specific rooms to chat, collaborate, or get matched for discussions. <br />
          You can either create your own group or join an existing one.
        </p>

        <div className="match-buttons">
          <button className="glow-button" onClick={() => navigate("/match/join")}>🔍 Join Group</button>
          <button className="glow-button" onClick={() => navigate("/match/create")}>➕ Create Group</button>
        </div>
      </div>
    </div>
  );
};

export default Match;

