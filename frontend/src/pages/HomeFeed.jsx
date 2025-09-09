import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./HomeFeed.css";

const HomeFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [composerFor, setComposerFor] = useState(null);
  const [composerText, setComposerText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareQuery, setShareQuery] = useState("");
  const [following, setFollowing] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [loadingSnippet, setLoadingSnippet] = useState("// fetching awesome content…");
  const [typedSnippet, setTypedSnippet] = useState("");
  const [sanitizedSnippet, setSanitizedSnippet] = useState("");
  const typingTimerRef = useRef(null);

  // (Reverted) Lazy media

  // Load mixed feed (following prioritized, topped up with others)
  const loadFeed = async () => {
    if (!currentUser?._id || loading) return;
    setLoading(true);
    // fire-and-forget: fetch a random code snippet from backend
    fetchSnippet().catch(() => {});
    try {
      // Fetch following-priority feed and global feed in parallel, then merge
      const [feedRes, globalRes] = await Promise.all([
        fetch(`${BASE_URL}/posts/feed?userId=${currentUser._id}&limit=20`),
        fetch(`${BASE_URL}/posts/global?exclude=${currentUser._id}&limit=40`),
      ]);
      const feedData = await feedRes.json();
      const globalData = await globalRes.json();
      const feedItems = Array.isArray(feedData?.posts) ? feedData.posts : [];
      const globalItems = Array.isArray(globalData?.posts) ? globalData.posts : [];

      // Dedupe and interleave with 2:1 bias to following
      const seen = new Set();
      const pri = [];
      for (const p of feedItems) { const id = String(p?._id||""); if (id && !seen.has(id)) { seen.add(id); pri.push(p);} }
      const secPool = [];
      for (const p of globalItems) {
        const id = String(p?._id || "");
        const ownerId = String(p?.userId?._id || p?.userId || "");
        if (id && !seen.has(id) && ownerId !== String(currentUser._id)) {
          seen.add(id);
          secPool.push(p);
        }
      }
      // light shuffle on secondary
      for (let i = secPool.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [secPool[i], secPool[j]]=[secPool[j], secPool[i]]; }
      const merged = [];
      let i = 0, j = 0;
      while ((i < pri.length || j < secPool.length) && merged.length < 20) {
        const preferPri = Math.random() < 0.66;
        if (preferPri && i < pri.length) merged.push(pri[i++]);
        else if (j < secPool.length) merged.push(secPool[j++]);
        else if (i < pri.length) merged.push(pri[i++]);
        else break;
      }
      let items = merged.length ? merged : [...pri, ...secPool].slice(0,20);
      if (!items.length) {
        try {
          const allRes = await fetch(`${BASE_URL}/posts/global?limit=20`);
          const allData = await allRes.json();
          const all = Array.isArray(allData?.posts) ? allData.posts : [];
          if (all.length) items = all.filter(p => String(p?.userId?._id || p?.userId || "") !== String(currentUser._id));
        } catch {}
      }
      // normalize counts for UI
      const normalized = items.map((p) => ({
        ...p,
        likesCount: Array.isArray(p.likes) ? p.likes.length : (p.likesCount || 0),
        commentsCount: Array.isArray(p.comments) ? p.comments.length : (p.commentsCount || 0),
      }));
      setPosts(normalized);
    } catch (e) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  async function fetchSnippet() {
    try {
      const res = await fetch(`${BASE_URL}/ai/snippet`);
      const data = await res.json();
      if (data?.snippet) setLoadingSnippet(data.snippet);
    } catch {}
  }

  // Sanitize AI fenced code and type it character-by-character
  useEffect(() => {
    if (!loading) return;
    const clean = (loadingSnippet || "").replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
    setSanitizedSnippet(clean);
    setTypedSnippet("");
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    let i = 0;
    const run = () => {
      setTypedSnippet((prev) => prev + (clean[i] || ""));
      i += 1;
      if (i < clean.length && loading) {
        const delay = 10 + Math.floor(Math.random() * 25); // 10-35ms per char
        typingTimerRef.current = setTimeout(run, delay);
      }
    };
    if (clean.length) typingTimerRef.current = setTimeout(run, 50);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [loadingSnippet, loading]);

  useEffect(() => {
    loadFeed();
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
    // no infinite scroll for now
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

      <div className="feed-sentinel">
        {loading ? (
          <div className="feed-loader">
            <div className="loader-title">Loading Feed…</div>
            <pre className="code-block">{typedSnippet}{typedSnippet.length < sanitizedSnippet.length ? <span className="caret"></span> : null}</pre>
          </div>
        ) : (
          "You’re all caught up"
        )}
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


