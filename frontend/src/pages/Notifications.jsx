import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Notifications.css";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${BASE_URL}/users/${u._id}/notifications`);
        setNotifications(res.data.pending || []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();
  }, [navigate]);

  const handleAccept = async (followerId) => {
    setProcessingIds(prev => new Set(prev).add(followerId));
    try {
      await axios.put(`${BASE_URL}/users/${user._id}/follow/accept`, { followerId });
      const updated = await axios.get(`${BASE_URL}/users/${user._id}/notifications`);
      setNotifications(updated.data.pending || []);
    } catch (err) {
      console.error("Failed to accept follow request:", err);
      alert("Failed to accept follow request. Please try again.");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(followerId);
        return newSet;
      });
    }
  };

  const handleReject = async (followerId) => {
    setProcessingIds(prev => new Set(prev).add(followerId));
    try {
      await axios.put(`${BASE_URL}/users/${user._id}/follow/reject`, { followerId });
      const updated = await axios.get(`${BASE_URL}/users/${user._id}/notifications`);
      setNotifications(updated.data.pending || []);
    } catch (err) {
      console.error("Failed to reject follow request:", err);
      alert("Failed to reject follow request. Please try again.");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(followerId);
        return newSet;
      });
    }
  };

  const handleAcceptAll = async () => {
    if (notifications.length === 0) return;
    
    setProcessingIds(new Set(notifications.map(n => n.user._id)));
    try {
      await Promise.all(
        notifications.map(n => 
          axios.put(`${BASE_URL}/users/${user._id}/follow/accept`, { followerId: n.user._id })
        )
      );
      const updated = await axios.get(`${BASE_URL}/users/${user._id}/notifications`);
      setNotifications(updated.data.pending || []);
    } catch (err) {
      console.error("Failed to accept all follow requests:", err);
      alert("Failed to accept all follow requests. Please try again.");
    } finally {
      setProcessingIds(new Set());
    }
  };

  const handleRejectAll = async () => {
    if (notifications.length === 0) return;
    
    setProcessingIds(new Set(notifications.map(n => n.user._id)));
    try {
      await Promise.all(
        notifications.map(n => 
          axios.put(`${BASE_URL}/users/${user._id}/follow/reject`, { followerId: n.user._id })
        )
      );
      const updated = await axios.get(`${BASE_URL}/users/${user._id}/notifications`);
      setNotifications(updated.data.pending || []);
    } catch (err) {
      console.error("Failed to reject all follow requests:", err);
      alert("Failed to reject all follow requests. Please try again.");
    } finally {
      setProcessingIds(new Set());
    }
  };

  if (!user) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-content">
          <button 
            className="back-btn"
            onClick={() => navigate("/profile")}
          >
            ←
          </button>
          <h1 className="notifications-title">Notifications</h1>
          <div className="header-actions">
            {user && (
              <div 
                className="profile-avatar"
                onClick={() => navigate("/profile")}
              >
                <img
                  src={
                    user.profileImage?.trim()
                      ? user.profileImage
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_id)}&background=6366f1&color=fff`
                  }
                  alt="Profile"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="notifications-section">
        {isLoading ? (
          <div className="notifications-loading">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You're all caught up! No pending follow requests.</p>
          </div>
        ) : (
          <>
            {/* Bulk Actions */}
            <div className="bulk-actions">
              <div className="bulk-actions-header">
                <h2>
                  {notifications.length} {notifications.length === 1 ? "follow request" : "follow requests"}
                </h2>
                <div className="bulk-buttons">
                  <button 
                    className="accept-all-btn"
                    onClick={handleAcceptAll}
                    disabled={processingIds.size > 0}
                  >
                    ✓ Accept All
                  </button>
                  <button 
                    className="reject-all-btn"
                    onClick={handleRejectAll}
                    disabled={processingIds.size > 0}
                  >
                    ✕ Reject All
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="notifications-list">
              {notifications.map((notification) => {
                const isProcessing = processingIds.has(notification.user._id);
                return (
                  <div 
                    key={notification.user._id}
                    className={`notification-card ${isProcessing ? 'processing' : ''}`}
                  >
                    <div className="notification-content">
                      <div 
                        className="user-info"
                        onClick={() => navigate(`/profile/${notification.user._id}`)}
                      >
                        <img
                          src={
                            notification.user.profileImage?.trim()
                              ? notification.user.profileImage
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.user.user_id)}&background=6366f1&color=fff`
                          }
                          alt={notification.user.user_id}
                          className="user-avatar"
                        />
                        <div className="user-details">
                          <h3 className="username">@{notification.user.user_id}</h3>
                          {notification.user.profession && (
                            <p className="profession">{notification.user.profession}</p>
                          )}
                          <p className="notification-text">wants to follow you</p>
                        </div>
                      </div>
                      
                      <div className="notification-actions">
                        {isProcessing ? (
                          <div className="processing-indicator">
                            <div className="processing-spinner"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <>
                            <button 
                              className="accept-btn"
                              onClick={() => handleAccept(notification.user._id)}
                            >
                              ✓ Accept
                            </button>
                            <button 
                              className="reject-btn"
                              onClick={() => handleReject(notification.user._id)}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {notification.user.skills && notification.user.skills.length > 0 && (
                      <div className="user-skills">
                        <span className="skills-label">Skills:</span>
                        <div className="skills-tags">
                          {notification.user.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                          {notification.user.skills.length > 3 && (
                            <span className="more-skills">+{notification.user.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;

