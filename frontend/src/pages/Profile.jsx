/*
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessagePulse, setHasNewMessagePulse] = useState(false);
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

      const fetchUnread = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/messages/unread-count/${parsedUser._id}`);
          const newCount = res.data?.count || 0;
          setUnreadCount((prev) => {
            if (newCount > prev) {
              setHasNewMessagePulse(true);
              setTimeout(() => setHasNewMessagePulse(false), 2500);
            }
            return newCount;
          });
        } catch (e) {
          // ignore
        }
      };

      fetchUser();
      fetchNotifications();
      fetchUnread();
      const interval = setInterval(fetchUnread, 5000);
      return () => clearInterval(interval);
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
      <div className="dropdown">
        <button className="dropdown-toggle">Menu ▾</button>
        <div className="dropdown-menu">
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => navigate("/edit-profile")}>Edit Profile</button>
        </div>
      </div>
    </div>

    <div className="top-bar-buttons">
      <button className="neon-button" onClick={() => navigate("/search-user")}>🔍</button>
      <div className="notification-wrapper">
        <button className="neon-button" onClick={() => navigate("/notifications")}>🔔</button>
        {notificationCount > 0 && <span className="notification-dot" />}
      </div>
      <button className="neon-button talk-button" onClick={() => navigate(`/inbox/${user._id}`)}>Talk</button>
      <button className="neon-button match-button" onClick={() => navigate("/match")}>💫 Match</button>
    </div>

<div className="user-section">

  <div className="profile-image-container">
    <img
      src={user.profileImage || "/../../public/assets/signup_page.png"}
      alt="Profile"
      className="profile-image"
      onClick={() => document.getElementById("imageUpload").click()}
    />
    <input
      type="file"
      id="imageUpload"
      accept="image/*"
      style={{ display: "none" }}
      onChange={async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
          const imageBase64 = reader.result;
          try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
              `${BASE_URL}/users/${user._id}/upload-image`,
              { imageBase64 },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser((prev) => ({ ...prev, profileImage: res.data.imageUrl }));
          } catch (err) {
            console.error("Upload failed:", err);
            alert("Image upload failed.");
          }
        };
        reader.readAsDataURL(file);
      }}
    />
  </div>

  <div className="user-basic">
    <p><strong>{user.user_id}</strong></p>
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
*/


import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import imageCompression from "browser-image-compression";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessagePulse, setHasNewMessagePulse] = useState(false);
  const [posts, setPosts] = useState([]); // user posts (SkillShots/SkillClips)
  const [activeTab, setActiveTab] = useState("all");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  const navigate = useNavigate();
  const location = useLocation();

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

      const fetchUserPosts = async (uid) => {
        try {
          const res = await axios.get(`${BASE_URL}/posts/user/${uid}`);
          if (Array.isArray(res.data)) setPosts(res.data);
        } catch (e) {
          console.error("Failed to fetch posts:", e);
        }
      };

      fetchUser();
      fetchNotifications();
      fetchUserPosts(parsedUser._id);

      const fetchUnread = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/messages/unread-count/${parsedUser._id}`);
          const newCount = res.data?.count || 0;
          setUnreadCount((prev) => {
            if (newCount > prev) {
              setHasNewMessagePulse(true);
              setTimeout(() => setHasNewMessagePulse(false), 2500);
            }
            return newCount;
          });
        } catch (e) {
          // ignore
        }
      };

      fetchUnread();
      const interval = setInterval(fetchUnread, 5000);
      return () => clearInterval(interval);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Refresh user data when returning from edit profile
  useEffect(() => {
    if (location.state?.refresh) {
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
            console.error("Failed to refresh user:", err);
          }
        };
        fetchUser();
      }
      // Clear the refresh flag
      navigate("/profile", { replace: true });
    }
  }, [location.state, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.');
      return;
    }

    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const base64 = await toBase64(compressedFile);
      
      setUploadProgress(95);
      
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE_URL}/users/${user._id}/upload-image`,
        { imageBase64: base64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUploadProgress(100);
      setUser((prev) => ({ ...prev, profileImage: res.data.imageUrl }));
      
      setTimeout(() => {
        setIsUploadingImage(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Image upload failed. Please try again.");
      setIsUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // Create a new post (SkillShot image or SkillClip video)
  const handleCreatePost = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert("Please select an image or video file.");
      return;
    }

    try {
      setIsCreatingPost(true);
      const base64 = await toBase64(file);
      const payload = {
        userId: user._id,
        mediaBase64: base64,
        mediaType: isVideo ? "video" : "image",
      };

      const res = await axios.post(`${BASE_URL}/posts`, payload);
      const created = res.data?.post;
      if (created) {
        setPosts((prev) => [created, ...prev]);
        setActiveTab("all");
      }
    } catch (e) {
      console.error("Failed to create post:", e);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsCreatingPost(false);
      // reset the input so the same file can be selected again
      if (event?.target) event.target.value = "";
    }
  };

  if (!user) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>
  );

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="header-left"></div>
        <div className="header-right">
          <div className="notification-badge">
            <button 
              className="notification-btn" 
              onClick={() => navigate("/notifications")}
            >
              🔔
            </button>
            {notificationCount > 0 && <span className="notification-dot">{notificationCount}</span>}
          </div>
          <div className="dropdown">
            <button className="menu-btn">⋮</button>
            <div className="dropdown-menu">
              <button onClick={() => navigate("/edit-profile")}>Edit Profile</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-info">
          <div className="profile-image-container">
            <div 
              className="profile-image-wrapper"
              onClick={() => document.getElementById("imageUpload").click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const file = files[0];
                  if (file.type.startsWith('image/')) {
                    const event = { target: { files: [file] } };
                    handleImageUpload(event);
                  }
                }
              }}
            >
              <img
                src={user.profileImage || "/assets/signup_page.png"}
                alt="Profile"
                className="profile-image"
              />
              <div className="image-overlay">
                {isUploadingImage ? (
                  <div className="upload-progress">
                    <div className="progress-circle">
                      <span>{uploadProgress}%</span>
                    </div>
                    <p>Uploading...</p>
                  </div>
                ) : (
                  <div className="upload-actions">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">
                      {user.profileImage ? "Change Photo" : "Add Photo"}
                    </span>
                    <span className="upload-hint">Click or drag & drop</span>
                  </div>
                )}
              </div>
            </div>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            {/* View full image removed per request */}
          </div>
          
          <div className="profile-details">
            <h2 className="username">@{user.user_id || "Unknown User"}</h2>
            <div className="stats-row">
              <div className="stat-item" onClick={() => navigate("/followers")}>
                <span className="stat-number">{followerCount}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item" onClick={() => navigate("/following")}>
                <span className="stat-number">{followingCount}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bio-section">
          <div className="bio-content">
            {/* Short Bio */}
            <div className="bio-main">
              <h4 className="bio-label">Bio</h4>
              <p className="bio-text">{user.bio || "No bio added yet. Share something about yourself!"}</p>
            </div>
            
            {/* Structured Bio (enhanced) */}
            <div className="bio-structured" role="region" aria-label="Profile summary">
              {user.bioHeadline ? (
                <div className="bio-row">
                  <span className="bio-key">Headline</span>
                  <span className="bio-value">{user.bioHeadline}</span>
                </div>
              ) : null}
              {user.bioSummary ? (
                <div className="bio-row">
                  <span className="bio-key">Summary</span>
                  <span className="bio-value">{user.bioSummary}</span>
                </div>
              ) : null}
              {Array.isArray(user.bioCoreSkills) && user.bioCoreSkills.length > 0 ? (
                <div className="bio-row">
                  <span className="bio-key">Core Skills</span>
                  <span className="bio-chips">
                    {user.bioCoreSkills.map((s, i) => (
                      <span key={`${s}-${i}`} className="chip">{s}</span>
                    ))}
                  </span>
                </div>
              ) : null}
              {user.bioMotivation ? (
                <div className="bio-row">
                  <span className="bio-key">Motivation</span>
                  <span className="bio-value">{user.bioMotivation}</span>
                </div>
              ) : null}
              {user.bioCurrentFocus ? (
                <div className="bio-row">
                  <span className="bio-key">Current Focus</span>
                  <span className="bio-value">{user.bioCurrentFocus}</span>
                </div>
              ) : null}
            </div>

            {/* Key Information */}
            <div className="user-details">
              {user.skills && user.skills.length > 0 && (
                <div className="detail-item">
                  <span className="detail-icon">🛠️</span>
                  <div className="detail-content">
                    <span className="detail-label">Skills</span>
                    <span className="detail-text">{user.skills.join(", ")}</span>
                  </div>
                </div>
              )}
              {user.profession && (
                <div className="detail-item">
                  <span className="detail-icon">💼</span>
                  <div className="detail-content">
                    <span className="detail-label">Profession</span>
                    <span className="detail-text">{user.profession}</span>
                  </div>
                </div>
              )}
              {user.experienceYears && (
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <div className="detail-content">
                    <span className="detail-label">Experience</span>
                    <span className="detail-text">{user.experienceYears} years</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="quick-actions" role="group" aria-label="Profile quick actions">
        <button 
          className="qa-btn match btn-3d" 
          onClick={() => navigate("/match")}
          aria-label="Open SkillRoom"
        >
          <span className="btn-3d__shadow" aria-hidden></span>
          <span className="btn-3d__edge" aria-hidden></span>
          <span className="btn-3d__front">SkillRoom</span>
        </button>
      </div>

      {/* SkillShots & SkillClips Section */}
      <div className="posts-section">
        <div className="posts-header">
          <h3 className="posts-title">Showcase</h3>
          <div className="posts-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >All</button>
            <button 
              className={`tab-btn ${activeTab === 'skillshot' ? 'active' : ''}`}
              onClick={() => setActiveTab('skillshot')}
            >SkillShots</button>
            <button 
              className={`tab-btn ${activeTab === 'skillclip' ? 'active' : ''}`}
              onClick={() => setActiveTab('skillclip')}
            >SkillClips</button>
          </div>
        </div>

        <div className="posts-grid">
          {/* Add Post */}
          <div 
            className="add-post-card" 
            onClick={() => document.getElementById("postUploadInput").click()}
            role="button"
            aria-label="Create new post"
          >
            <div className="add-post-content">
              <span className="add-icon">{isCreatingPost ? "⏳" : "➕"}</span>
              <h4>{isCreatingPost ? "Uploading..." : "Create Skill"}</h4>
              <p>Image (SkillShot) or Video (SkillClip)</p>
            </div>
            <input 
              id="postUploadInput" 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleCreatePost}
              style={{ display: "none" }}
            />
          </div>

          {/* Render posts */}
          {(() => {
            const items = activeTab === 'all' 
              ? posts 
              : posts.filter(p => p.kind === activeTab);
            if (!items.length) return null;
            return items.map((p) => (
              <div 
                key={p._id} 
                className={`post-card ${p.mediaType === 'video' ? 'reel-card' : ''}`}
                onClick={() => setLightbox({ open: true, index: posts.findIndex(x => x._id === p._id) })}
              >
                <button className="post-kebab" onClick={(e) => {
                  e.stopPropagation();
                  const want = window.confirm("Delete this item?");
                  if (!want) return;
                  (async () => {
                    try {
                      await fetch(`${BASE_URL}/posts/${p._id}`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user._id })
                      });
                      setPosts((prev) => prev.filter((x) => x._id !== p._id));
                    } catch (err) {
                      alert('Failed to delete');
                    }
                  })();
                }}>⋯</button>
                {p.mediaType === 'image' ? (
                  <div className="post-image">
                    <img src={p.mediaUrl} alt={p.caption || 'SkillShot'} />
                  </div>
                ) : (
                  <div className="post-video">
                    <video src={p.mediaUrl} controls playsInline preload="metadata" />
                  </div>
                )}
                {p.caption ? (
                  <div className="post-info">
                    <p>{p.caption}</p>
                  </div>
                ) : null}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Reuse PublicProfile lightbox styles */}
      {lightbox.open && posts[lightbox.index] && (
        <div className="lightbox" onClick={() => setLightbox({ open: false, index: 0 })}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-media">
              <div className="lightbox-strip">
                {posts.map((p) => (
                  <div key={p._id} className="lightbox-slide">
                    {p.mediaType === 'image' ? (
                      <img src={p.mediaUrl} alt="view" />
                    ) : (
                      <video src={p.mediaUrl} controls playsInline />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="lightbox-side">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                <button onClick={() => setLightbox({ open:false, index:0 })}>← Back</button>
                <span style={{color:'#6b7280', fontSize:12}}>Item {lightbox.index+1} / {posts.length}</span>
              </div>
              <div className="lightbox-actions">
                <button className="like-btn">
                  <span>{Array.isArray(posts[lightbox.index]?.likes) ? posts[lightbox.index].likes.length : 0}</span>
                </button>
                <button className="share-btn">Share</button>
              </div>
              <div className="comments"></div>
            </div>
          </div>
        </div>
      )}

      {/* Footer spacer for bottom nav */}
      <div style={{ height: 72 }} />
    </div>
  );
};

export default Profile;

