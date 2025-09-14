/**
 * ===============================================
 * File: Signup.jsx
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    React component for user registration functionality.
 *
 * Features:
 *    - Controlled input form for username, email, and password
 *    - Input validation (empty fields, email format, password length)
 *    - POST request to /api/auth/signup to create a new user
 *    - On success: stores user in localStorage and redirects to /profile
 *    - On failure: displays validation or server errors via toast
 *
 * Dependencies:
 *    - react: Component, useState for form state
 *    - react-router-dom: useNavigate for redirection, Link for routing
 *    - react-toastify: Toast notifications for success/error feedback
 *    - Signup.css: Styling for authentication form UI
 *
 * Purpose:
 *    Provides a clean registration experience in the TechReel frontend,
 *    validating user input and connecting with the backend signup API.
 * ===============================================
 */
import { BASE_URL } from "../utils/api";

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "./Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    user_id: "",
    email: "",
    password: "",
    qualification: "",
    skills: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userIdStatus, setUserIdStatus] = useState("idle"); // idle | checking | available | taken | invalid
  const debounceRef = useRef(null);
  const userIdInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Username availability check with debounce
  useEffect(() => {
    const value = formData.user_id.trim();
    if (!value) { setUserIdStatus("idle"); return; }
    if (!/^[_a-zA-Z0-9]{3,20}$/.test(value)) { setUserIdStatus("invalid"); return; }
    setUserIdStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/availability?user_id=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (res.ok && data && typeof data.available === 'boolean') {
          setUserIdStatus(data.available ? "available" : "taken");
        } else {
          setUserIdStatus("idle");
        }
      } catch {
        setUserIdStatus("idle");
      }
    }, 450);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [formData.user_id]);

  const validateInputs = () => {
    const { user_id, email, password, qualification, skills } = formData;
    if (!user_id || !email || !password || !qualification || !skills) {
      toast.error("All fields are required", { toastId: "su-missing" });
      return false;
    }
    if (!/^[_a-zA-Z0-9]{3,20}$/.test(user_id)) {
      toast.error("User ID must be 3–20 chars: letters, numbers, underscore", { toastId: "su-uid" });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format", { toastId: "su-email" });
      return false;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters", { toastId: "su-pass" });
      return false;
    }
    if (userIdStatus === "taken") {
      toast.error("User ID is already taken", { toastId: "su-taken" });
      return false;
    }
    if (userIdStatus === "invalid") {
      toast.error("Invalid User ID format", { toastId: "su-invalid" });
      return false;
    }
    return true;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  if (!validateInputs()) return;

  try {
    setIsSubmitting(true);
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Signup successful! Redirecting...", { toastId: "signup-success" });
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user && data.user._id) {
        localStorage.setItem("userId", data.user._id);
      }
      setTimeout(() => navigate("/profile"), 1200);
    } else {
      setIsSubmitting(false);
      toast.error(data.message || "Signup failed", { toastId: "signup-fail" });
    }

  } catch (err) {
    setIsSubmitting(false);
    toast.error("Server error during signup", { toastId: "signup-server" });
  }
};



  return (
    <div className="signup-container">
	  <h2>
  <span className="skilltalk-brand">SkillTalk</span><br />
  Sign Up
</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ position:'relative' }} onClick={() => userIdInputRef.current?.focus()}>
          <input
            name="user_id"
            type="text"
            placeholder="User ID (e.g., rahul_07)"
            value={formData.user_id}
            onChange={handleChange}
            disabled={isSubmitting}
            style={{ paddingRight: 88 }}
            ref={userIdInputRef}
          />
          {userIdStatus !== 'idle' && (
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color: userIdStatus==='available' ? '#10b981' : userIdStatus==='taken' ? '#ef4444' : '#6b7280' }}>
              {userIdStatus === 'checking' && 'Checking…'}
              {userIdStatus === 'available' && 'Available'}
              {userIdStatus === 'taken' && 'Taken'}
              {userIdStatus === 'invalid' && 'Invalid'}
            </span>
          )}
        </div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <div style={{ position:'relative' }} onClick={() => passwordInputRef.current?.focus()}>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            style={{ paddingRight: 110 }}
            ref={passwordInputRef}
          />
          <button type="button" onClick={() => setShowPassword((s) => !s)} style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', background:'rgba(17,24,39,0.85)', border:'1px solid rgba(0,255,255,0.35)', color:'#cbd5e1', cursor:'pointer', padding:'4px 10px', height:30, borderRadius:8, fontSize:12, fontWeight:700, zIndex:2, width:'auto', display:'inline-flex', alignItems:'center', justifyContent:'center' }} aria-label="Toggle password visibility">
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <input
          name="qualification"
          type="text"
          placeholder="Qualification (e.g., B.Tech)"
          value={formData.qualification}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <input
          name="skills"
          type="text"
          placeholder="Skills (e.g., React, Node, MongoDB)"
          value={formData.skills}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Start Talking"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Signup;
