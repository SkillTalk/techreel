import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Following.css";
import { useNavigate, useParams } from "react-router-dom";

const Following = () => {
  const [following, setFollowing] = useState([]);
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
        
        // Get accepted following - the backend already populates the user data
        const acceptedFollowing = (profileRes.data.user.following || [])
          .filter(f => f.status === "accepted" && f.user)
          .map(f => f.user);
        
        setFollowing(acceptedFollowing);
      } catch (error) {
        console.error("Error fetching following:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, navigate]);

  const handleUserClick = (followingUser) => {
    navigate(`/profile/${followingUser._id}`);
  };

  if (!user) {
    return (
      <div className="following-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="following-container">
      {/* Header */}
      <div className="following-header">
        <div className="header-content">
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
          <h1 className="following-title">
            {profileUser && profileUser._id === user._id ? "You're Following" : `${profileUser?.user_id} is Following`}
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

      {/* Following Section */}
      <div className="following-section">
        {isLoading ? (
          <div className="following-loading">
            <div className="loading-spinner"></div>
            <p>Loading following...</p>
          </div>
        ) : following.length === 0 ? (
          <div className="no-following">
            <div className="no-following-icon">👤</div>
            <h3>Not following anyone yet</h3>
            <p>
              {profileUser && profileUser._id === user._id 
                ? "Start following people to see their updates and connect!" 
                : `${profileUser?.user_id} isn't following anyone yet.`}
            </p>
          </div>
        ) : (
          <>
            {/* Following Count */}
            <div className="following-count">
              <h2>
                {following.length} {following.length === 1 ? "person" : "people"}
              </h2>
            </div>

            {/* Following Grid */}
            <div className="following-grid">
              {following.map((followingUser) => (
                <div 
                  key={followingUser._id}
                  className="following-card"
                  onClick={() => handleUserClick(followingUser)}
                >
                  <div className="following-avatar">
                    <img
                      src={
                        followingUser.profileImage?.trim()
                          ? followingUser.profileImage
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(followingUser.user_id)}&background=6366f1&color=fff`
                      }
                      alt={followingUser.user_id}
                    />
                    <div className="online-indicator"></div>
                  </div>
                  
                  <div className="following-info">
                    <h3 className="following-username">@{followingUser.user_id}</h3>
                    {followingUser.profession && (
                      <p className="following-profession">{followingUser.profession}</p>
                    )}
                    {followingUser.bio && (
                      <p className="following-bio">{followingUser.bio}</p>
                    )}
                  </div>
                  
                  {followingUser.skills && followingUser.skills.length > 0 && (
                    <div className="following-skills">
                      <div className="skills-tags">
                        {followingUser.skills.slice(0, 2).map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                        {followingUser.skills.length > 2 && (
                          <span className="more-skills">+{followingUser.skills.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="following-stats">
                    <div className="stat">
                      <span className="stat-number">{followingUser.followers?.length || 0}</span>
                      <span className="stat-label">Followers</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{followingUser.following?.length || 0}</span>
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

export default Following;

