import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!token) return setMsg("Invalid or missing token.");
    if (password !== confirm) return setMsg("Passwords do not match.");
    const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!strong.test(password)) return setMsg("Use 8+ chars with letters and numbers.");
    try {
      setSubmitting(true);
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed");
      setMsg("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMsg(err.message || "Unable to reset password");
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <h2><span className="skilltalk-brand">SkillTalk</span><br/>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input type="password" placeholder="New password" value={password} onChange={(e)=>setPassword(e.target.value)} disabled={submitting} />
        <input type="password" placeholder="Confirm password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} disabled={submitting} />
        <button type="submit" disabled={submitting}>{submitting ? "Updating…" : "Update Password"}</button>
      </form>
      {msg ? <p style={{ marginTop:12 }}>{msg}</p> : null}
    </div>
  );
};

export default ResetPassword;


