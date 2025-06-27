import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import io from "socket.io-client";
import "./PublicProfile.css"; // CSS imported here

const socket = io(BASE_URL);

const PublicProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followStatus, setFollowStatus] = useState(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ bio: "", website: "" });
  const navigate = useNavigate();

  // Load logged-in user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  // Fetch profile user data + determine follow status
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/users/${id}`);
        setUser(res.data.user);
        setFormData({
          bio: res.data.user.bio || "",
          website: res.data.user.website || "",
        });

        // Match follow status only if currentUser exists
        if (currentUser && res.data.user.followers) {
          const match = res.data.user.followers.find(
            (f) => f.user === currentUser._id || f.user?._id === currentUser._id
          );
          if (match) setFollowStatus(match.status);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("User not found");
      }
    };

    if (id && currentUser) fetchProfile();

    // Real-time updates for follow status
    socket.on("follow-update", (data) => {
      if (data.to === id || data.from === id) {
        setFollowStatus((prev) =>
          prev === "accepted" || prev === "pending" ? null : "accepted"
        );
      }
    });
  }, [id, currentUser]);

  const handleFollow = async () => {
    try {
      await axios.post(`${BASE_URL}/users/${id}/follow`, {
        senderId: currentUser._id,
      });
      setFollowStatus("pending");
      socket.emit("follow", { from: currentUser._id, to: id });
    } catch (err) {
      console.error("Follow error:", err);
      alert("Could not send follow request");
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.post(`${BASE_URL}/users/${id}/unfollow`, {
        senderId: currentUser._id,
      });
      setFollowStatus(null);
      socket.emit("unfollow", { from: currentUser._id, to: id });
    } catch (err) {
      console.error("Unfollow error:", err);
      alert("Could not unfollow user");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/users/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUser((prev) => ({ ...prev, ...formData }));
      setEditMode(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Could not update profile.");
    }
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  const isOwnProfile = currentUser && currentUser._id === user._id;

  return (
    <div className="profile-wrapper">
      <div className="top-bar">
        <h2 className="public-name">
          {user.user_id || "Public Profile"}
        </h2>
      </div>

      <div className="user-section">
        <div className="user-basic">
          <p><strong>{user.user_id}</strong></p>
          <p>{user.email}</p>
        </div>

        <div className="user-stats">
          <button className="stats-button" onClick={() => navigate(`/followers/${user._id}`)}>
            Follower<br />
            {user.followers?.filter(f => f.status === "accepted").length || 0}
          </button>
          <button className="stats-button" onClick={() => navigate(`/following/${user._id}`)}>
            Following<br />
            {user.following?.filter(f => f.status === "accepted").length || 0}
          </button>
        </div>
      </div>

      <div className="bio-box">
        <p><strong>Bio:</strong></p>
        <p>{user.bio || "No bio available."}</p>
      </div>

      {currentUser && currentUser._id !== user._id && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          {followStatus === "accepted" ? (
            <>
              <button className="followBtn" onClick={handleUnfollow}>Unfollow</button>
              {/* Pass user data to chat via location.state */}
              <button className="followBtn" onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}>Message</button>
            </>
          ) : followStatus === "pending" ? (
            <>
              <button className="followBtn" onClick={handleUnfollow}>Cancel</button>
              <button className="followBtn" onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}>Message</button>
            </>
          ) : (
            <>
              <button className="followBtn" onClick={handleFollow}>Follow</button>
              <button className="followBtn" onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}>Message</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfile;

