import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./Match.css";

const CreateGroup = () => {
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [category, setCategory] = useState("general");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);
  const [currency, setCurrency] = useState("INR");
  const navigate = useNavigate();

const handleCreate = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return alert("User not found");

  if (!name.trim()) {
    alert("Please enter a group name");
    return;
  }

  try {
    console.log("🔍 Creating group with data:", { name, maxMembers, isPublic, adminId: user._id });
    
    const res = await axios.post(`${BASE_URL}/groups/create`, {
      name: name.trim(),
      maxMembers: parseInt(maxMembers),
      isPublic,
      adminId: user._id,
      category,
      isPaid,
      price: isPaid ? Number(price) : 0,
      currency,
    });

    console.log("🔍 Group creation response:", res.data);

    if (res.data.success) {
      const groupId = res.data.group._id;
      alert(`✅ Group "${name}" created successfully!`);
      navigate(`/match/group/${groupId}`);
    } else {
      alert(`❌ Failed to create group: ${res.data.message || "Unknown error"}`);
    }
  } catch (err) {
    console.error("❌ Group creation error:", err);
    if (err.response?.data?.message) {
      alert(`❌ Failed to create group: ${err.response.data.message}`);
    } else {
      alert("❌ Failed to create group. Please try again.");
    }
  }
};

  return (
    <div className="match-page">
      <div className="match-header">
        <button className="back-btn" onClick={() => navigate("/match")} aria-label="Back">←</button>
        <div className="headings">
          <h1 className="title">Create a Group</h1>
          <p className="subtitle">Set a name, size, and choose Public or Private.</p>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, boxShadow: "0 6px 14px rgba(0,0,0,.04)" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="text"
              placeholder="Group name (e.g., React Learners)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Max Members</label>
                <input
                  type="number"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  min={2}
                  max={100}
                  style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Visibility</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => !isPaid && setIsPublic(true)}
                    className="btn"
                    style={{ padding: 12, borderRadius: 10, border: 0, cursor: isPaid ? "not-allowed" : "pointer", opacity: isPaid ? 0.6 : 1, fontWeight: 700, background: isPublic && !isPaid ? "linear-gradient(135deg,#667eea,#764ba2)" : "#f3f4f6", color: isPublic && !isPaid ? "#fff" : "#111827" }}
                  >Public</button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className="btn"
                    style={{ padding: 12, borderRadius: 10, border: 0, cursor: "pointer", fontWeight: 700, background: !isPublic ? "linear-gradient(135deg,#667eea,#764ba2)" : "#f3f4f6", color: !isPublic ? "#fff" : "#111827" }}
                  >Private</button>
                </div>
                {isPaid && (
                  <p style={{ marginTop: 6, fontSize: 12, color: "#ef4444" }}>
                    Paid groups are always private. Visibility switched to Private.
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}>
                  {[
                    ["general","General"],
                    ["education","Educational"],
                    ["music","Musical"],
                    ["politics","Political"],
                    ["property","Property"],
                    ["technology","Technology"],
                    ["health","Health"],
                    ["art","Art"],
                    ["sports","Sports"],
                    ["finance","Finance"],
                    ["other","Other"],
                  ].map(([val,label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Paid Access</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} /> Paid Group
                  </label>
                </div>
              </div>
            </div>

            {isPaid && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Price</label>
                  <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 6 }}>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #e5e7eb", outline: "none" }}>
                    {["INR","USD","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
            <button className="btn primary" onClick={handleCreate}>Create Group</button>
          </div>
        </div>
      </div>

      <div className="spacer" />
    </div>
  );
};

export default CreateGroup;

