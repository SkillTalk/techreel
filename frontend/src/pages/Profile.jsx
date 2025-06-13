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
import axios from "axios";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ bio: "", website: "" });
  const [notifications, setNotifications] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const fetchUser = async () => {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/users/${parsedUser._id}`
          );
          setUser(res.data.user);
          setEditForm({
            bio: res.data.user.bio || "",
            website: res.data.user.website || "",
          });
          setFollowers(res.data.user.followers || []);
          setFollowing(res.data.user.following || []);

          const notifRes = await axios.get(
            `http://localhost:5000/api/users/${parsedUser._id}/notifications`
          );
          setNotifications(notifRes.data.pending || []);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          localStorage.removeItem("user");
          navigate("/login");
        }
      };
      fetchUser();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleSearch = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/search?query=${query}`
      );
      setResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSaveChanges = async () => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${user._id}`,
        editForm
      );
      setUser(res.data.user);
      setEditMode(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleAcceptFollow = async (followerId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/${user._id}/follow/accept`,
        { followerId }
      );

      const updatedRes = await axios.get(
        `http://localhost:5000/api/users/${user._id}`
      );
      setUser(updatedRes.data.user);
      setFollowers(updatedRes.data.user.followers || []);
      setFollowing(updatedRes.data.user.following || []);

      const notifRes = await axios.get(
        `http://localhost:5000/api/users/${user._id}/notifications`
      );
      setNotifications(notifRes.data.pending || []);
    } catch (error) {
      console.error("Failed to accept follow request:", error);
    }
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="signup-container">
      <h2>Welcome, {user.user_id}!</h2>
      <p>Email: {user.email}</p>
      <p>Bio: {user.bio || "No bio added yet."}</p>
      <p>
        Website:{" "}
        {user.website ? (
          <a href={user.website} target="_blank" rel="noreferrer">
            {user.website}
          </a>
        ) : (
          "N/A"
        )}
      </p>

      {!editMode ? (
        <button onClick={() => setEditMode(true)} style={{ marginTop: "10px" }}>
          Edit Profile
        </button>
      ) : (
        <div style={{ marginTop: "10px" }}>
          <h4>Edit Your Profile</h4>
          <input
            type="text"
            placeholder="Update Bio"
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            style={{ marginBottom: "5px", width: "100%" }}
          />
          <br />
          <input
            type="text"
            placeholder="Update Website"
            value={editForm.website}
            onChange={(e) =>
              setEditForm({ ...editForm, website: e.target.value })
            }
            style={{ marginBottom: "10px", width: "100%" }}
          />
          <br />
          <button onClick={handleSaveChanges}>Save Changes</button>
          <button
            onClick={() => setEditMode(false)}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
      )}

      <button onClick={handleLogout} style={{ marginTop: "10px" }}>
        Logout
      </button>

      <hr />
      <h3>Search Users</h3>
      <input
        type="text"
        placeholder="Search by username"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {results.map((otherUser) => (
          <li
            key={otherUser._id}
            onClick={() => navigate(`/profile/${otherUser._id}`)}
            style={{ cursor: "pointer", marginTop: "5px" }}
          >
            {otherUser.user_id}
            {otherUser.email && ` (${otherUser.email})`}
          </li>
        ))}
      </ul>

      <hr />
      <h3>Notifications</h3>
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((req) => (
            <li key={req.user._id}>
              {req.user.user_id} wants to follow you
              {req.status === "pending" && (
                <button
                  onClick={() => handleAcceptFollow(req.user._id)}
                  style={{ marginLeft: "10px" }}
                >
                  Accept
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No follow requests.</p>
      )}

      <hr />
      <h3>Followers</h3>
      {followers.length > 0 ? (
        <ul>
          {followers.map((f) => (
            <li key={f.user._id || f.user}>
              {typeof f.user === "object" ? f.user.user_id : f.user} ({f.status}
              )
            </li>
          ))}
        </ul>
      ) : (
        <p>No followers yet.</p>
      )}

      <h3>Following</h3>
      {following.length > 0 ? (
        <ul>
          {following.map((f) => (
            <li key={f.user._id || f.user}>
              {typeof f.user === "object" ? f.user.user_id : f.user} ({f.status}
              )
            </li>
          ))}
        </ul>
      ) : (
        <p>Not following anyone yet.</p>
      )}
    </div>
  );
};

export default Profile;
