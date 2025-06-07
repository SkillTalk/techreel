/**
 * ===============================================
 * File: Profile.jsx
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    React component for displaying the logged-in user's profile.
 *
 * Features:
 *    - Retrieves user details from localStorage
 *    - Redirects to login page if user is not authenticated
 *    - Displays username and email of the user
 *    - Provides logout functionality by clearing localStorage
 *
 * Dependencies:
 *    - react: For component, state, and lifecycle management
 *    - react-router-dom: For navigation (useNavigate)
 *
 * Purpose:
 *    Serves as a basic authenticated landing page for the user
 *    after login. Can be extended to include more profile details,
 *    profile editing, or user-specific data in the future.
 * ===============================================
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        navigate("/login"); // Redirect if not logged in
      }
    } catch (err) {
      console.error("Invalid user data in localStorage", err);
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="signup-container">
      <h2>Welcome, {user.username}!</h2>
      <p>Email: {user.email}</p>
      <button
        onClick={() => {
          localStorage.clear();
          navigate("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Profile;
