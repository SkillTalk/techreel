import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./Inbox.css";

const Inbox = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      const fetchInbox = async () => {
        try {
          const res = await fetch(`${BASE_URL}/messages/inbox/${user._id}`);
          const data = await res.json();
          console.log("📥 Inbox API response:", data);

          if (res.ok && Array.isArray(data)) {
            setConversations(data);
          } else {
            setConversations([]);
          }
        } catch (err) {
          console.error("❌ Error fetching inbox:", err);
          setConversations([]);
        } finally {
          setLoading(false);
        }
      };

      fetchInbox();
    } else {
      setLoading(false);
      console.error("❌ No user in localStorage");
    }
  }, []);

  const handleClick = (user) => {
    navigate(`/message/${user._id}`, { state: { selectedUser: user } });
  };

  const filtered = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(({ user, lastMessage }) => {
      const name = (user?.user_id || "").toLowerCase();
      const msg = (lastMessage?.text || "").toLowerCase();
      return name.includes(q) || msg.includes(q);
    });
  }, [searchQuery, conversations]);

  const [confirm, setConfirm] = useState({ open: false, target: null });

  // long-press support (touch/click)
  let pressTimer;
  const startPress = (target) => {
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => setConfirm({ open: true, target }), 550);
  };
  const cancelPress = () => clearTimeout(pressTimer);

  const deleteConversation = async (otherUserId) => {
    try {
      const me = currentUser?._id;
      if (!me || !otherUserId) return;
      const res = await fetch(`${BASE_URL}/messages/conversation/${me}/${otherUserId}`, { method: 'DELETE' });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.user._id !== otherUserId));
        setConfirm({ open: false, target: null });
      }
    } catch (e) {
      console.error('Failed to delete conversation', e);
    }
  };

  return (
    <div className="inbox-wrapper">
      {currentUser && (
        <div
          className="corner-avatar"
          onClick={() => navigate("/profile")}
          title="Go to your profile"
        >
          <span className="corner-initial">
            {currentUser.user_id?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
      )}

      <h2 className="inbox-title">Your Conversations</h2>
      <div className="mini-search">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="no-convo-text">Loading...</p>
      ) : Array.isArray(filtered) && filtered.length === 0 ? (
        <p className="no-convo-text">No messages yet. Start a conversation!</p>
      ) : (
        <ul className="conversation-list">
          {filtered.map(({ user, lastMessage }) => (
            <li
              key={user._id}
              className={`conversation-card ${lastMessage && lastMessage.receiverId === currentUser?._id && lastMessage.seen === false ? 'is-unread' : ''}`}
              onMouseDown={() => startPress(user)}
              onMouseUp={cancelPress}
              onMouseLeave={cancelPress}
              onTouchStart={() => startPress(user)}
              onTouchEnd={cancelPress}
              onClick={() => handleClick(user)}
            >
              <div className="conv-left">
                {user.profileImage ? (
                  <div className="conv-avatar with-img">
                    <img src={user.profileImage} alt={user.user_id} onError={(e)=>{e.currentTarget.style.display='none';}} />
                    <span className="status-dot" />
                  </div>
                ) : (
                  <div className="conv-avatar">{(user.user_id || 'U').charAt(0).toUpperCase()}<span className="status-dot" /></div>
                )}
                <div className="conv-meta">
                  <div className="conv-name">@{user.user_id}</div>
                  <div className="conv-preview">{lastMessage?.text || "No messages yet"}</div>
                </div>
              </div>
              <div className="conv-action">›</div>
            </li>
          ))}
        </ul>
      )}

      {confirm.open && confirm.target && (
        <div className="delete-backdrop" onClick={() => setConfirm({ open:false, target:null })}>
          <div className="delete-sheet" onClick={(e) => e.stopPropagation()}>
            <h4 className="delete-title">Delete conversation?</h4>
            <p className="delete-sub">This will remove the entire chat history with @{confirm.target.user_id} from your device.</p>
            <div className="delete-actions">
              <button className="btn-flat" onClick={() => setConfirm({ open:false, target:null })}>Cancel</button>
              <button className="btn-danger" onClick={() => deleteConversation(confirm.target._id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;

