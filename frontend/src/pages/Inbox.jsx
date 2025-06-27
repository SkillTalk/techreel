import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./Inbox.css";

const Inbox = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!currentUser?._id) {
      console.error("❌ currentUser or _id missing in localStorage");
      setLoading(false);
      return;
    }

    const fetchInbox = async () => {
      try {
        const res = await fetch(`${BASE_URL}/messages/inbox/${currentUser._id}`);
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
  }, [currentUser?._id]);

  const handleClick = (user) => {
    navigate(`/message/${user._id}`, { state: { selectedUser: user } });
  };

  return (
    <div className="inbox-wrapper">
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

