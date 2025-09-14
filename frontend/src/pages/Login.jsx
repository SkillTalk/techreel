/**
 * ===============================================
 * File: Login.jsx
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    React component for user login functionality.
 *
 * Features:
 *    - Renders a login form with controlled inputs
 *    - Validates user inputs before submission
 *    - Sends POST request to /api/auth/login
 *    - On success: shows toast, saves user/token to localStorage, redirects to /profile
 *    - On failure: displays relevant error messages via toast
 *
 * Dependencies:
 *    - react: For state and component management
 *    - react-router-dom: For navigation and routing (useNavigate, Link)
 *    - react-toastify: For toast-based user feedback
 *    - Signup.css: Shared or renamed styles (optional)
 *
 * Purpose:
 *    Core part of the frontend authentication flow in the TechReel web app.
 *    Ensures user credentials are verified and stored properly for session handling.
 * ===============================================
 */


import { BASE_URL } from "../utils/api";

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./Signup.css"; // Reuse styling

const Login = () => {
  const [formData, setFormData] = useState({
    user_id: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [fpValue, setFpValue] = useState("");
  const [fpSubmitting, setFpSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateInputs = () => {
    const { user_id, password } = formData;
    if (!user_id || !password) {
      toast.error("All fields are required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // prevent double submit
    if (!validateInputs()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful! Redirecting...", { toastId: "login-success" });
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        if (data.user && data.user._id) localStorage.setItem("userId", data.user._id);
        setTimeout(() => navigate("/profile"), 1200);
      } else {
        setIsSubmitting(false);
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      setIsSubmitting(false);
      toast.error("Server error during login");
    }
  };

  const requestPasswordReset = async () => {
    if (!fpValue || fpSubmitting) return;
    try {
      setFpSubmitting(true);
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: fpValue })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Reset link sent if the account exists.");
        setForgotOpen(false);
        setFpValue("");
      } else {
        toast.error(data.message || "Could not send reset link");
      }
    } catch (e) {
      toast.error("Network error. Try again.");
    } finally {
      setFpSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <h1 className="skilltalk-logo">SkillTalk</h1>
      <p className="login-instruction">
        Please enter your User ID and Password
      </p>

      <form onSubmit={handleSubmit}>
        <input
          name="user_id"
          type="text"
          placeholder="User ID"
          value={formData.user_id}
          onChange={handleChange}
          className="animated-input"
          disabled={isSubmitting}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="animated-input"
          disabled={isSubmitting}
        />
        <div className="login-options">
          <label>
            <input type="checkbox" style={{ marginRight: "5px" }} disabled={isSubmitting} /> Remember Me
          </label>
          <button type="button" className="forgot-password" onClick={() => setForgotOpen(true)} style={{ background:'transparent', border:0, color:'#00ffff', cursor:'pointer' }}>Forgot Password?</button>
        </div>

        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Enter SkillTalk"}
        </button>
      </form>

      {forgotOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }} onClick={() => !fpSubmitting && setForgotOpen(false)}>
          <div style={{ width:'min(92vw, 420px)', background:'#0b0f14', border:'1px solid #1f2950', color:'#e5e7eb', borderRadius:12, padding:16 }} onClick={(e)=>e.stopPropagation()}>
            <h3 style={{ margin:'0 0 8px', fontSize:18 }}>Forgot Password</h3>
            <p style={{ margin:'0 0 10px', fontSize:13, color:'#9ca3af' }}>Enter your email or user ID. We’ll send a reset link if an account exists.</p>
            <input value={fpValue} onChange={(e)=>setFpValue(e.target.value)} placeholder="Email or user ID" style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#111827', color:'#e5e7eb' }} />
            <div style={{ display:'flex', gap:8, marginTop:12, justifyContent:'flex-end' }}>
              <button onClick={() => setForgotOpen(false)} disabled={fpSubmitting} style={{ padding:'10px 14px', background:'#111827', border:'1px solid #334155', color:'#e5e7eb', borderRadius:8 }}>Cancel</button>
              <button onClick={requestPasswordReset} disabled={fpSubmitting || !fpValue} style={{ padding:'10px 14px', background:'linear-gradient(135deg, #00ff94, #00c3ff)', border:'none', color:'#000', borderRadius:8, fontWeight:700 }}>{fpSubmitting ? 'Sending…' : 'Send Link'}</button>
            </div>
          </div>
        </div>
      )}

      <p style={{ marginTop: "1rem" }}>
        Don’t have an account? <Link to="/">Signup here</Link>
      </p>
    </div>
  );
};

export default Login;
