import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";

const PostDetails = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${BASE_URL}/posts/${postId}`);
        const data = await res.json();
        setPost(data);
      } catch {}
    };
    fetchPost();
  }, [postId]);

  if (!post) return <div style={{ padding: 16, color: '#111' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 650, margin: '0 auto', padding: 16 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Back</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#eee' }}>
          {post.userId?.profileImage ? (
            <img src={post.userId.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : null}
        </div>
        <div>
          <div style={{ fontWeight: 800, cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.userId?._id}`)}>@{post.userId?.user_id}</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(post.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div>
        {post.mediaType === 'video' ? (
          <video src={post.mediaUrl} controls playsInline preload="metadata" style={{ width: '100%', maxHeight: '70vh', background: '#000' }} />
        ) : (
          <img src={post.mediaUrl} alt="" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', background: '#000' }} />
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        {(post.comments || []).map((c) => (
          <div key={c._id} style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 800, cursor: 'pointer' }} onClick={() => navigate(`/profile/${c.userId?._id}`)}>@{c.userId?.user_id || 'user'}</span>
            <span> {c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostDetails;


