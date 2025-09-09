import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./HomeFeed.css";

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const navigate = useNavigate();
  const [composerFor, setComposerFor] = useState(null);
  const [composerText, setComposerText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareQuery, setShareQuery] = useState("");
  const [following, setFollowing] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("user"));

  // (Reverted) Lazy media

  // Load posts by following list (reference approach similar to PublicProfile.jsx)
  const loadFollowingPosts = async () => {
    if (!currentUser?._id || loading) return;
    setLoading(true);
    try {
      // 1) Get full user to read following
      const resUser = await fetch(`${BASE_URL}/users/${currentUser._id}`);
      const dataUser = await resUser.json();
      const followArr = Array.isArray(dataUser?.user?.following) ? dataUser.user.following : [];
      const followingIds = followArr
        .map((f) => (f?.user?._id ? f.user._id : f?.user))
        .filter(Boolean)
        .filter((id) => String(id) !== String(currentUser._id));

      if (followingIds.length === 0) {
        setPosts([]);
        setHasMore(false);
        return;
      }

      // 2) Fetch posts for each following user in parallel
      const results = await Promise.all(
        followingIds.map((uid) => fetch(`${BASE_URL}/posts/user/${uid}`).then((r) => r.json()).catch(() => []))
      );
      // 3) Flatten, dedupe, sort by createdAt desc
      const flat = [];
      const seen = new Set();
      for (const arr of results) {
        if (Array.isArray(arr)) {
          for (const p of arr) {
            const id = String(p?._id || "");
            if (id && !seen.has(id)) {
              seen.add(id);
              flat.push(p);
            }
          }
        }
      }
      flat.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPosts(flat);
      setHasMore(false);
      setCursor(null);
    } catch (e) {
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowingPosts();
    // preload following list for share popup
    const preloadFollowing = async () => {
      try {
        if (!currentUser?._id) return;
        const res = await fetch(`${BASE_URL}/users/${currentUser._id}`);
        const data = await res.json();
        const list = (data?.user?.following || [])
          .map((f) => (f.user?._id ? f.user : null))
          .filter(Boolean)
          .map((u) => ({ _id: u._id, user_id: u.user_id, profileImage: u.profileImage }));
        setFollowing(list);
      } catch {}
    };
    preloadFollowing();
    // disable infinite scroll for following feed only
    setHasMore(false);
    return () => {};
    // eslint-disable-next-line
  }, []);

  // Removed bootstrap/iteration logic per request

  const toggleLike = async (postId, index) => {
    try {
      const res = await fetch(`${BASE_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      const data = await res.json();
      setPosts((prev) => {
        const copy = [...prev];
        const p = { ...copy[index] };
        p.likesCount = data.likes || 0;
        p.liked = Boolean(data.liked);
        copy[index] = p;
        return copy;
      });
    } catch {}
  };

  const submitComment = async (postId, index) => {
    const text = composerText.trim();
    if (!text) return;
    try {
      const res = await fetch(`${BASE_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id, text }),
      });
      const data = await res.json();
      setPosts((prev) => {
        const copy = [...prev];
        const p = { ...copy[index] };
        p.comments = data.comments || p.comments || [];
        p.commentsCount = Array.isArray(p.comments) ? p.comments.length : 0;
        copy[index] = p;
        return copy;
      });
      setComposerText("");
      setComposerFor(null);
    } catch {}
  };

  return (
    <div className="feed-container">
      {posts.map((p, idx) => (
        <div key={p._id} className="feed-card">
          <div className="feed-header">
            <div className="feed-avatar">
              {p.userId?.profileImage ? (
                <img src={p.userId.profileImage} alt={p.userId?.user_id} onClick={() => navigate(`/profile/${p.userId?._id}`)} style={{ cursor: 'pointer' }} />
              ) : (
                <div className="avatar-fallback" onClick={() => navigate(`/profile/${p.userId?._id}`)} style={{ cursor: 'pointer' }}>{(p.userId?.user_id || 'U').charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div className="feed-meta">
              <div className="feed-user" onClick={() => navigate(`/profile/${p.userId?._id}`)} style={{ cursor: 'pointer' }}>@{p.userId?.user_id}</div>
              <div className="feed-time">{new Date(p.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <div className="feed-media">
            {p.mediaType === 'video' ? (
              <video src={p.mediaUrl} controls playsInline preload="metadata" muted disablePictureInPicture controlsList="nodownload noplaybackrate" />
            ) : (
              <img src={p.mediaUrl} alt="skill" />
            )}
          </div>
          <div className="feed-actions">
            <button className="fa-btn" onClick={() => toggleLike(p._id, idx)}>{p.liked ? '❤️' : '🤍'} {p.likesCount || 0}</button>
            <button className="fa-btn" onClick={() => setComposerFor(p._id)}>💬 {p.commentsCount || 0}</button>
            <button className="fa-btn" onClick={() => { setShareOpen(true); }}>↗ {Array.isArray(p.shares) ? p.shares.length : 0}</button>
          </div>
          {composerFor === p._id && (
            <div className="feed-composer">
              <input
                type="text"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Add a comment..."
              />
              <button onClick={() => submitComment(p._id, idx)}>Post</button>
            </div>
          )}
          {Array.isArray(p.comments) && p.comments.length > 0 && (
            <div className="feed-comments">
              {p.comments.slice(0, 2).map((c) => (
                <div key={c._id} className="feed-comment">
                  <span className="c-user" onClick={() => navigate(`/profile/${c.userId?._id}`)}>@{c.userId?.user_id || 'user'}</span>
                  <span className="c-text">{c.text}</span>
                </div>
              ))}
              {p.comments.length > 2 && (
                <div className="c-more" onClick={() => navigate(`/post/${p._id}`)} style={{ cursor: 'pointer' }}>
                  View all {p.comments.length} comments
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div ref={sentinelRef} className="feed-sentinel">
        {loading ? "Loading..." : hasMore ? "" : "You’re all caught up"}
      </div>

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
                    <button onClick={() => { alert(`Shared to @${u.user_id}`); setShareOpen(false); }}>Share</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeFeed;


