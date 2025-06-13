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

import React, { useState } from "react";
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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateInputs = () => {
    const { user_id, email, password, qualification, skills } = formData;
    if (!user_id || !email || !password || !qualification || !skills) {
      toast.error("All fields are required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Signup successful! Redirecting...");
        localStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch (err) {
      toast.error("Server error during signup");
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="user_id"
          type="text"
          placeholder="User ID (e.g., rahul_07)"
          value={formData.user_id}
          onChange={handleChange}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        <input
          name="qualification"
          type="text"
          placeholder="Qualification (e.g., B.Tech)"
          value={formData.qualification}
          onChange={handleChange}
        />
        <input
          name="skills"
          type="text"
          placeholder="Skills (e.g., React, Node, MongoDB)"
          value={formData.skills}
          onChange={handleChange}
        />
        <button type="submit">Sign Up</button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Signup;
