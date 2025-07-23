import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./Inbox.css";

const Inbox = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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

      {loading ? (
        <p className="no-convo-text">Loading...</p>
      ) : Array.isArray(conversations) && conversations.length === 0 ? (
        <p className="no-convo-text">No messages yet. Start a conversation!</p>
      ) : (
        <ul className="conversation-list">
          {conversations.map(({ user, lastMessage }) => (
            <li key={user._id} className="conversation-card" onClick={() => handleClick(user)}>
              <div className="username">{user.user_id}</div>
              <div className="preview">{lastMessage?.text || "No messages yet"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Inbox;

