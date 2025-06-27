import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { SOCKET_URL, BASE_URL } from "../utils/api";
import "./message.css";

const socket = io(SOCKET_URL);

const Message = () => {
  const { id } = useParams(); // selected user's ID from URL
  const location = useLocation();
  const passedUser = location.state?.selectedUser || JSON.parse(localStorage.getItem("selectedUser"));

  const [selectedUser, setSelectedUser] = useState(passedUser || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;

  // Save selectedUser to localStorage in case user refreshes
  useEffect(() => {
    if (passedUser) {
      localStorage.setItem("selectedUser", JSON.stringify(passedUser));
    }
  }, [passedUser]);

  // Fetch selected user info from backend if not passed via state
  useEffect(() => {
    const fetchSelectedUser = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/${id}`);
        const data = await res.json();
        if (res.ok && data?.user) {
          setSelectedUser(data.user);
        } else {
          console.error("❌ Failed to fetch user:", data);
        }
      } catch (err) {
        console.error("❌ Error fetching selected user:", err);
      }
    };

    if (!passedUser && id) fetchSelectedUser();
  }, [id, passedUser]);

  // Join socket and fetch messages
  useEffect(() => {
    if (!currentUserId || !selectedUser?._id) return;

    socket.emit("addUser", currentUserId);

    socket.on("getMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/messages/${currentUserId}/${selectedUser._id}`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error("❌ Unexpected message data:", data);
        }
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();

    return () => {
      socket.off("getMessage");
    };
  }, [currentUserId, selectedUser?._id]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUserId || !selectedUser?._id) return;

    const msg = {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: trimmed,
    };

    socket.emit("sendMessage", msg);

    try {
      const res = await fetch(`${BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ DB save failed:", errorData);
      }
    } catch (err) {
      console.error("❌ Error saving message to DB:", err);
    }

    setMessages((prev) => [...prev, { ...msg, timestamp: Date.now() }]);
    setText("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        {selectedUser?.user_id || "Unknown User"}
      </div>

      <div className="chat-body">
        {Array.isArray(messages) &&
          messages.map((m, i) => (
            <div
              key={i}
              className={`message ${m.senderId === currentUserId ? "me" : "you"}`}
            >
              {m.text}
            </div>
          ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type something..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default Message;

