import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Followers.css";
import { useNavigate, useParams } from "react-router-dom";

const Followers = () => {
  const [followers, setFollowers] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      navigate("/login");
      return;
    }
    setUser(storedUser);

    const finalUserId = userId || storedUser._id;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the profile user data
        const profileRes = await axios.get(`${BASE_URL}/users/${finalUserId}`);
        setProfileUser(profileRes.data.user);
        
        // Get accepted followers - the backend already populates the user data
        const acceptedFollowers = (profileRes.data.user.followers || [])
          .filter(f => f.status === "accepted" && f.user)
          .map(f => f.user);
        
        setFollowers(acceptedFollowers);
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, navigate]);

  const handleUserClick = (follower) => {
    navigate(`/profile/${follower._id}`);
  };

  if (!user) {
    return (
      <div className="followers-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="followers-container">
      {/* Header */}
      <div className="followers-header">
        <div className="header-content">
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
          <h1 className="followers-title">
            {profileUser && profileUser._id === user._id ? "Your Followers" : `${profileUser?.user_id}'s Followers`}
          </h1>
          <div className="header-actions">
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
          </div>
        </div>
      </div>

      {/* Followers Section */}
      <div className="followers-section">
        {isLoading ? (
          <div className="followers-loading">
            <div className="loading-spinner"></div>
            <p>Loading followers...</p>
          </div>
        ) : followers.length === 0 ? (
          <div className="no-followers">
            <div className="no-followers-icon">👥</div>
            <h3>No followers yet</h3>
            <p>
              {profileUser && profileUser._id === user._id 
                ? "When people follow you, they'll appear here." 
                : `${profileUser?.user_id} doesn't have any followers yet.`}
            </p>
          </div>
        ) : (
          <>
            {/* Followers Count */}
            <div className="followers-count">
              <h2>
                {followers.length} {followers.length === 1 ? "follower" : "followers"}
              </h2>
            </div>

            {/* Followers Grid */}
            <div className="followers-grid">
              {followers.map((follower) => (
                <div 
                  key={follower._id}
                  className="follower-card"
                  onClick={() => handleUserClick(follower)}
                >
                  <div className="follower-avatar">
                    <img
                      src={
                        follower.profileImage?.trim()
                          ? follower.profileImage
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.user_id)}&background=6366f1&color=fff`
                      }
                      alt={follower.user_id}
                    />
                    <div className="online-indicator"></div>
                  </div>
                  
                  <div className="follower-info">
                    <h3 className="follower-username">@{follower.user_id}</h3>
                    {follower.profession && (
                      <p className="follower-profession">{follower.profession}</p>
                    )}
                    {follower.bio && (
                      <p className="follower-bio">{follower.bio}</p>
                    )}
                  </div>
                  
                  {follower.skills && follower.skills.length > 0 && (
                    <div className="follower-skills">
                      <div className="skills-tags">
                        {follower.skills.slice(0, 2).map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                        {follower.skills.length > 2 && (
                          <span className="more-skills">+{follower.skills.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="follower-stats">
                    <div className="stat">
                      <span className="stat-number">{follower.followers?.length || 0}</span>
                      <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{follower.following?.length || 0}</span>
                      <span className="stat-label">Following</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Followers;

