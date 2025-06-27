
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      const fetchUser = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/users/${parsedUser._id}`);
          setUser(res.data.user);

          const acceptedFollowers = res.data.user.followers?.filter(f => f.status === "accepted") || [];
          const acceptedFollowing = res.data.user.following?.filter(f => f.status === "accepted") || [];

          setFollowerCount(acceptedFollowers.length);
          setFollowingCount(acceptedFollowing.length);
        } catch (err) {
          console.error("Failed to fetch user:", err);
          navigate("/login");
        }
      };

      const fetchNotifications = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/users/${parsedUser._id}/notifications`);
          const count = Array.isArray(res.data.pending) ? res.data.pending.length : 0;
          setNotificationCount(count);
        } catch (err) {
          console.error("Failed to fetch notifications:", err);
        }
      };

      fetchUser();
      fetchNotifications();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="profile-wrapper">
      <div className="profile-header">
        <button className="logout-button" onClick={handleLogout}>Logout</button>
        <button className="edit-profile-button" onClick={() => navigate("/edit-profile")}>Edit Profile</button>
      </div>

      <div className="top-bar">
        <div className="top-bar-buttons">
          <button className="neon-button" onClick={() => navigate("/search-user")}>🔍</button>
          <div className="notification-wrapper">
            <button className="neon-button" onClick={() => navigate("/notifications")}>🔔</button>
            {notificationCount > 0 && <span className="notification-dot" />}
          </div>
          <button
            className={`neon-button talk-button ${hasNewMessages ? "talk-flash" : ""}`}
          onClick={() => navigate(`/inbox/${user._id}`)}
          >
            Talk
          </button>
        </div>
      </div>

      <div className="user-section">
        <div className="user-basic">
          <p><strong>{user.user_id}</strong></p>
          <p>{user.email}</p>
        </div>

        <div className="user-stats">
          <button className="stats-button" onClick={() => navigate("/followers")}>
            Follower<br />{followerCount}
          </button>
          <button className="stats-button" onClick={() => navigate("/following")}>
            Following<br />{followingCount}
          </button>
        </div>
      </div>

      <div className="bio-box">
        <p><strong>Bio:</strong></p>
        <p>{user.bio || "No bio added yet."}</p>
      </div>
    </div>
  );
};

export default Profile;

