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
    if (!validateInputs()) return;

    try {
	const res = await fetch(`${BASE_URL}/auth/login`, {
	method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Login successful! Redirecting...");
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      toast.error("Server error during login");
    }
  };

  return (
    <div className="signup-container">
      <h1 className="login-heading">Hi !</h1>
      <h2 className="login-subheading">Welcome Back</h2>
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
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="animated-input"
        />
        <div className="login-options">
          <label>
            <input type="checkbox" style={{ marginRight: "5px" }} /> Remember Me
          </label>
          <span className="forgot-password">Forgot Password?</span>
        </div>

        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Don’t have an account? <Link to="/">Signup here</Link>
      </p>
    </div>
  );
};

export default Login;
