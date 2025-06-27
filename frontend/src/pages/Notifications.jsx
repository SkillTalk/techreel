import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Notifications.css";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const u = JSON.parse(stored);
    setUser(u);

    const fetch = async () => {
      const res = await axios.get(`${BASE_URL}/users/${u._id}/notifications`);
      setNotifications(res.data.pending || []);
    };
    fetch();
  }, []);

  const handleAccept = async (followerId) => {
    await axios.put(`${BASE_URL}/users/${user._id}/follow/accept`, { followerId });
    const updated = await axios.get(`${BASE_URL}/users/${user._id}/notifications`);
    setNotifications(updated.data.pending || []);
  };

  const handleReject = async (followerId) => {
    await axios.put(`${BASE_URL}/users/${user._id}/follow/reject`, { followerId });
    const updated = await axios.get(`${BASE_URL}/users/${user._id}/notifications`);
    setNotifications(updated.data.pending || []);
  };

  return (
    <div className="followers-wrapper">
      <h2>Notifications</h2>
      {notifications.length === 0 ? (
        <p>No follow requests.</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.user._id}>
              <span
                className="clickable-name"
                onClick={() => navigate(`/profile/${n.user._id}`)}
              >
                {n.user.user_id}
              </span>{" "}
              wants to follow you
              <div className="btn-group">
                <button onClick={() => handleAccept(n.user._id)}>Accept</button>
                <button onClick={() => handleReject(n.user._id)}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;

