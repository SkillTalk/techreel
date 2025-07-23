import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Match.css";

const CreateGroup = () => {
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const navigate = useNavigate();

const handleCreate = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return alert("User not found");

  try {
    const res = await axios.post("/api/groups/create", {
      name,
      maxMembers,
      isPublic,
      adminId: user._id,
    });

    if (res.data.success) {
      const groupId = res.data.group._id;
      navigate(`/match/group/${groupId}`);
    }
  } catch (err) {
    alert("Failed to create group");
  }
};

  return (
    <div className="match-container">
      <button className="back-button" onClick={() => navigate("/match")}>
        ← Back
      </button>

      <h2 className="match-title">➕ Create Group</h2>
      <p className="match-description">
        Start a new group and invite others to join. Choose a name, member limit, and visibility.
      </p>

      <div className="match-buttons">
        <input
          type="text"
          placeholder="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="glow-input"
        />
        <input
          type="number"
          placeholder="Max Members"
          value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value)}
          min={2}
          max={100}
          className="glow-input"
        />
        <label style={{ color: "#ccc" }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          &nbsp; Public Group
        </label>
        <button className="glow-button" onClick={handleCreate}>
          🚀 Create Group
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;

