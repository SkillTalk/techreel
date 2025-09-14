import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL, SOCKET_URL } from "../utils/api";
import io from "socket.io-client";
import "./Profile.css";

// Connect sockets to the API host, not the REST base (which may include /api)
const socket = io(SOCKET_URL, { path: "/socket.io" });

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
    <div className="profile-page">
      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
          </div>
          <div className="header-right"></div>
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-info">
            <div className="profile-image-container">
              <div className="profile-image-wrapper" onClick={() => user.profileImage && window.open(user.profileImage, "_blank") }>
                <img src={user.profileImage || "/assets/signup_page.png"} alt="Profile" className="profile-image" />
              </div>
            </div>
            <div className="profile-details">
              <h2 className="username">@{user.user_id}</h2>
              <div className="stats-row">
                <div className="stat-item" onClick={() => navigate(`/followers/${user._id}`)}>
                  <span className="stat-number">{user.followers?.filter(f => f.status === "accepted").length || 0}</span>
                  <span className="stat-label">Followers</span>
                </div>
                <div className="stat-item" onClick={() => navigate(`/following/${user._id}`)}>
                  <span className="stat-number">{user.following?.filter(f => f.status === "accepted").length || 0}</span>
                  <span className="stat-label">Following</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions: Follow/Unfollow + Message */}
          {currentUser && currentUser._id !== user._id && (
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', margin:'8px 0 16px' }}>
              {followStatus === "accepted" ? (
                <>
                  <button
                    onClick={handleUnfollow}
                    style={{ padding:'12px 18px', borderRadius:12, border:'2px solid #e5e7eb', background:'#fff', color:'#111827', fontWeight:700, cursor:'pointer' }}
                  >
                    Unfollow
                  </button>
                  <button
                    onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}
                    style={{ padding:'12px 18px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#667eea 0%, #764ba2 100%)', color:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 6px 18px rgba(102,126,234,.35)' }}
                  >
                    Message
                  </button>
                </>
              ) : followStatus === "pending" ? (
                <>
                  <button
                    onClick={handleUnfollow}
                    style={{ padding:'12px 18px', borderRadius:12, border:'2px solid #e5e7eb', background:'#fff', color:'#111827', fontWeight:700, cursor:'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}
                    style={{ padding:'12px 18px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#667eea 0%, #764ba2 100%)', color:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 6px 18px rgba(102,126,234,.35)' }}
                  >
                    Message
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollow}
                    style={{ padding:'12px 18px', borderRadius:12, border:'2px solid #e5e7eb', background:'#fff', color:'#111827', fontWeight:700, cursor:'pointer' }}
                  >
                    Follow
                  </button>
                  <button
                    onClick={() => navigate(`/message/${user._id}`, { state: { selectedUser: user } })}
                    style={{ padding:'12px 18px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#667eea 0%, #764ba2 100%)', color:'#fff', fontWeight:700, cursor:'pointer', boxShadow:'0 6px 18px rgba(102,126,234,.35)' }}
                  >
                    Message
                  </button>
                </>
              )}
            </div>
          )}

          {/* Bio Section */}
          <div className="bio-section">
            <div className="bio-content">
              <div className="bio-main">
                <h4 className="bio-label">Bio</h4>
                <p className="bio-text">{user.bio || "No bio available. This user hasn't shared anything about themselves yet."}</p>
              </div>

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

              {/* Projects and basic details */}
              <div className="user-details">
                {Array.isArray(user.portfolioProjects) && user.portfolioProjects.length > 0 && (
                  <div className="detail-item" style={{ display:'block' }}>
                    <span className="detail-icon">📁</span>
                    <div className="detail-content">
                      <span className="detail-label">Projects</span>
                      <div style={{ display:'grid', gap:14 }}>
                        {user.portfolioProjects.map((pr, idx) => {
                          const when = [pr.start, pr.end].filter(Boolean).join(' – ') || (pr.duration || '');
                          const bullets = (pr.summary || pr.impact || '')
                            .split(/\n|\.|•|\-/)
                            .map(s => s.trim())
                            .filter(Boolean)
                            .slice(0,6);
                          return (
                            <div key={idx} style={{ background:'rgba(255,255,255,0.96)', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                                <div>
                                  <div style={{ fontWeight:700, color:'#111827' }}>{pr.name || 'Project'}</div>
                                  {(pr.role || pr.company) && (
                                    <div style={{ color:'#374151', marginTop:2, fontSize:13 }}>
                                      {pr.role ? pr.role : ''}{pr.role && pr.company ? ' @ ' : ''}{pr.company || ''}
                                    </div>
                                  )}
                                </div>
                                <div style={{ color:'#6b7280', fontSize:12 }}>{when}</div>
                              </div>
                              {bullets.length > 0 && (
                                <ul style={{ margin:'8px 0 0', paddingLeft:18, color:'#374151', lineHeight:1.45, fontSize:13 }}>
                                  {bullets.map((b,i)=>(<li key={i}>{b}</li>))}
                                </ul>
                              )}
                              {Array.isArray(pr.tools) && pr.tools.length > 0 && (
                                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
                                  {pr.tools.slice(0,14).map((t, i) => (
                                    <span key={i} className="chip" style={{ background:'#eef2ff', border:'1px solid #e5e7eb', color:'#1f2937' }}>{t}</span>
                                  ))}
                                </div>
                              )}
                              {pr.link && <a href={pr.link} target="_blank" rel="noreferrer" className="detail-link" style={{ marginTop:10, display:'inline-block' }}>View</a>}
                            </div>
                          );
                        })}
                      </div>
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

        {/* Follow/Message actions moved above; old block removed */}

        {/* Showcase Section */}
        <div className="posts-section">
          <div className="posts-header">
            <h3 className="posts-title">Showcase</h3>
            <div className="posts-tabs">
              <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
              <button className={`tab-btn ${activeTab === 'skillshot' ? 'active' : ''}`} onClick={() => setActiveTab('skillshot')}>SkillShots</button>
              <button className={`tab-btn ${activeTab === 'skillclip' ? 'active' : ''}`} onClick={() => setActiveTab('skillclip')}>SkillClips</button>
            </div>
          </div>

          <div className="posts-grid">
            {(() => {
              const items = activeTab === 'all' ? posts : posts.filter(p => p.kind === activeTab);
              if (!items.length) return null;
              return items.map((p) => (
                <div 
                  key={p._id} 
                  className={`post-card ${p.mediaType === 'video' ? 'reel-card' : ''}`}
                  onClick={() => setLightbox({ open: true, index: posts.findIndex(x => x._id === p._id) })}
                >
                  {p.mediaType === 'image' ? (
                    <div className="post-image">
                      <img src={p.mediaUrl} alt={p.caption || 'SkillShot'} />
                    </div>
                  ) : (
                    <div className="post-video">
                      <video src={p.mediaUrl} playsInline preload="metadata" />
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
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

