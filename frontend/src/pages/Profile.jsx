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
