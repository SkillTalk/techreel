import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import io from "socket.io-client";
import "./PublicProfile.css";

const socket = io(BASE_URL);

const PublicProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [followStatus, setFollowStatus] = useState(null);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]); // skillshots/skillclips
  const [activeTab, setActiveTab] = useState("all");
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });
  const [shareOpen, setShareOpen] = useState(false);
  const [shareQuery, setShareQuery] = useState("");
  const [following, setFollowing] = useState([]);
  const navigate = useNavigate();

  // Load logged-in user from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  // Fetch profile user data + determine follow status + fetch posts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/users/${id}`);
        setUser(res.data.user);

        if (currentUser && res.data.user?.followers) {
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

    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/posts/user/${id}`);
        if (Array.isArray(res.data)) setPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };
    const fetchFollowing = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/users/${id}`);
        const list = res.data?.user?.following || [];
        const normalized = list
          .map((f) => f.user?._id ? f.user : null)
          .filter(Boolean)
          .map((u) => ({ _id: u._id, user_id: u.user_id, profileImage: u.profileImage }));
        setFollowing(normalized);
      } catch (e) {
        // ignore
      }
    };

    if (id) {
      fetchProfile();
      fetchPosts();
      fetchFollowing();
    }

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

  if (error) return (
    <div className="public-loading">
      <div className="error-message">
        <span className="error-icon">❌</span>
        <p>{error}</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="public-loading">
      <div className="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>
  );

  return (
    <div className="public-profile-container">
      {/* Header */}
      <div className="public-header">
        <div className="header-left">
          <button 
            className="back-btn" 
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <h1 className="public-app-title">SkillTalk</h1>
        </div>
        <div className="header-right">
          {currentUser && (
            <div 
              className="user-avatar"
              onClick={() => navigate("/profile")}
              title="Go to your profile"
            >
              <img 
                src={currentUser.profileImage || "/assets/signup_page.png"} 
                alt="Your Profile"
                className="avatar-image"
              />
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="public-profile-section">
        <div className="public-profile-info">
          <div className="public-profile-image-container">
            <div 
              className="public-profile-image-wrapper"
              onClick={() => {
                if (user.profileImage) {
                  window.open(user.profileImage, "_blank");
                }
              }}
            >
              <img
                src={user.profileImage || "/assets/signup_page.png"}
                alt="Profile"
                className="public-profile-image"
              />
              {user.profileImage && (
                <div className="public-image-overlay">
                  <span className="view-full-icon">👁️</span>
                  <span className="view-full-text">View Full Image</span>
                </div>
              )}
            </div>
            <div className="profile-status">
              <span className="status-dot"></span>
              <span className="status-text">Active</span>
            </div>
          </div>
          
          <div className="public-profile-details">
            <h2 className="public-username">{user.user_id}</h2>
            <div className="public-stats-row">
              <div className="public-stat-item" onClick={() => navigate(`/followers/${user._id}`)}>
                <span className="public-stat-number">{user.followers?.filter(f => f.status === "accepted").length || 0}</span>
                <span className="public-stat-label">Followers</span>
              </div>
              <div className="public-stat-item" onClick={() => navigate(`/following/${user._id}`)}>
                <span className="public-stat-number">{user.following?.filter(f => f.status === "accepted").length || 0}</span>
                <span className="public-stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bio Section */}
        <div className="public-bio-section">
          <div className="public-bio-content">
            <div className="public-bio-main">
              <p className="public-bio-text">{user.bio || "No bio available. This user hasn't shared anything about themselves yet."}</p>
            </div>
            
            {/* User Details */}
            <div className="public-user-details">
              {user.location && (
                <div className="public-detail-item">
                  <span className="public-detail-icon">📍</span>
                  <span className="public-detail-text">{user.location}</span>
                </div>
              )}
              {user.profession && (
                <div className="public-detail-item">
                  <span className="public-detail-icon">💼</span>
                  <span className="public-detail-text">{user.profession}</span>
                </div>
              )}
              {user.education && (
                <div className="public-detail-item">
                  <span className="public-detail-icon">🎓</span>
                  <span className="public-detail-text">{user.education}</span>
                </div>
              )}
              {user.skills && user.skills.length > 0 && (
                <div className="public-detail-item">
                  <span className="public-detail-icon">🛠️</span>
                  <span className="public-detail-text">{user.skills.join(", ")}</span>
                </div>
              )}
              {user.interests && user.interests.length > 0 && (
                <div className="public-detail-item">
                  <span className="public-detail-icon">❤️</span>
                  <span className="public-detail-text">{user.interests.join(", ")}</span>
                </div>
              )}
              {user.website && (
                <div className="public-detail-item">
                  <span className="public-detail-icon">🌐</span>
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="public-detail-link">
                    {user.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {currentUser && currentUser._id !== user._id && (
        <div className="public-action-buttons">
          {followStatus === "accepted" ? (
            <>
              <button className="public-action-btn secondary" onClick={handleUnfollow}>
                <span className="public-btn-icon">👥</span>
                <span className="public-btn-text">Unfollow</span>
              </button>
              <button 
                className="public-action-btn primary" 
                onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}
              >
                <span className="public-btn-icon">💬</span>
                <span className="public-btn-text">Message</span>
              </button>
            </>
          ) : followStatus === "pending" ? (
            <>
              <button className="public-action-btn secondary" onClick={handleUnfollow}>
                <span className="public-btn-icon">⏳</span>
                <span className="public-btn-text">Cancel</span>
              </button>
              <button 
                className="public-action-btn primary" 
                onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}
              >
                <span className="public-btn-icon">💬</span>
                <span className="public-btn-text">Message</span>
              </button>
            </>
          ) : (
            <>
              <button className="public-action-btn accent" onClick={handleFollow}>
                <span className="public-btn-icon">➕</span>
                <span className="public-btn-text">Follow</span>
              </button>
              <button 
                className="public-action-btn primary" 
                onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}
              >
                <span className="public-btn-icon">💬</span>
                <span className="public-btn-text">Message</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Public Showcase Section */}
      <div className="public-posts-section">
        <div className="public-posts-header">
          <h3 className="public-posts-title">Showcase</h3>
          <div className="public-posts-tabs">
            <button 
              className={`public-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >All</button>
            <button 
              className={`public-tab-btn ${activeTab === 'skillshot' ? 'active' : ''}`}
              onClick={() => setActiveTab('skillshot')}
            >SkillShots</button>
            <button 
              className={`public-tab-btn ${activeTab === 'skillclip' ? 'active' : ''}`}
              onClick={() => setActiveTab('skillclip')}
            >SkillClips</button>
          </div>
        </div>

        <div className="public-posts-grid">
          {(() => {
            const items = activeTab === 'all' ? posts : posts.filter(p => p.kind === activeTab);
            if (!items.length) return <p className="public-empty-text">No showcase items yet.</p>;
            return items.map((p, idx) => (
              <div 
                key={p._id} 
                className={`public-post-card ${p.mediaType === 'video' ? 'public-reel-card' : ''}`}
                onClick={() => setLightbox({ open: true, index: posts.findIndex(x => x._id === p._id) })}
              >
                {p.mediaType === 'image' ? (
                  <div className="public-post-image">
                    <img src={p.mediaUrl} alt={p.caption || 'SkillShot'} />
                  </div>
                ) : (
                  <div className="public-post-video">
                    <video src={p.mediaUrl} playsInline preload="metadata" />
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Lightbox modal */}
      {lightbox.open && posts[lightbox.index] && (
        <div className="lightbox" onClick={() => setLightbox({ open: false, index: 0 })}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-media">
              <div 
                className="lightbox-strip"
                onScroll={(e) => {
                  const x = e.currentTarget.scrollLeft;
                  const w = e.currentTarget.clientWidth;
                  const idx = Math.round(x / w);
                  if (idx !== lightbox.index) setLightbox((s) => ({ ...s, index: idx }));
                }}
              >
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
                <button 
                  className={`like-btn ${posts[lightbox.index].liked ? 'liked' : ''}`}
                  onClick={async () => {
                    try {
                      const res = await axios.post(`${BASE_URL}/posts/${posts[lightbox.index]._id}/like`, { userId: currentUser?._id });
                      setPosts((prev) => prev.map((p, i) => i === lightbox.index ? { ...p, liked: res.data.liked, likes: new Array(res.data.likes).fill(0) } : p));
                    } catch {}
                  }}
                >
                  <span>{Array.isArray(posts[lightbox.index].likes) ? posts[lightbox.index].likes.length : 0}</span>
                </button>
                <button className="share-btn" onClick={() => setShareOpen(true)}>↗ Share</button>
              </div>
              <div className="comments">
                {Array.isArray(posts[lightbox.index].comments) && posts[lightbox.index].comments.length > 0 ? posts[lightbox.index].comments.map((c) => (
                  <div key={c._id} className="comment">
                    <img src={c.userId?.profileImage || '/assets/signup_page.png'} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div>
                      <strong>@{c.userId?.user_id || 'user'}</strong>
                      <div>{c.text}</div>
                    </div>
                    <small style={{ marginLeft: 'auto' }}>{new Date(c.createdAt).toLocaleString()}</small>
                  </div>
                )) : (
                  <div style={{color:'#6b7280', fontSize:13}}>No comments yet.</div>
                )}
              </div>
              <form className="comment-form" onSubmit={async (e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem('commentText');
                const text = input.value.trim();
                if (!text) return;
                try {
                  const res = await axios.post(`${BASE_URL}/posts/${posts[lightbox.index]._id}/comment`, { userId: currentUser?._id, text });
                  setPosts((prev) => prev.map((p, i) => i === lightbox.index ? { ...p, comments: res.data.comments } : p));
                  input.value = '';
                } catch {}
              }}>
                <input name="commentText" placeholder="Add a comment..." />
                <button type="submit">Post</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Share popup */}
      {shareOpen && (
        <div className="share-popup" onClick={() => setShareOpen(false)}>
          <div className="share-card" onClick={(e) => e.stopPropagation()}>
            <div className="share-head">
              <h4>Share to...</h4>
              <button onClick={() => setShareOpen(false)}>✕</button>
            </div>
            <input 
              className="share-search" 
              placeholder="Search people you follow" 
              value={shareQuery}
              onChange={(e) => setShareQuery(e.target.value)}
            />
            <div className="share-list">
              {following
                .filter((u) => (u.user_id || '').toLowerCase().includes(shareQuery.toLowerCase()))
                .map((u) => (
                  <div key={u._id} className="share-item">
                    <img src={u.profileImage || '/assets/signup_page.png'} alt="" style={{ width: 34, height: 34, borderRadius: '50%' }} />
                    <span>@{u.user_id}</span>
                    <button onClick={() => alert(`Shared to @${u.user_id}`)}>Share</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Removed Connect & Learn section per request */}
    </div>
  );
};

export default PublicProfile;

