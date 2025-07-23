import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { SOCKET_URL, BASE_URL } from "../utils/api";
import "./message.css";

const socket = io(SOCKET_URL);

const Message = () => {
  const { id } = useParams();
  const location = useLocation();
  const passedUser = location.state?.selectedUser || JSON.parse(localStorage.getItem("selectedUser"));

  const [selectedUser, setSelectedUser] = useState(passedUser || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const chatEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;

  useEffect(() => {
    if (passedUser) {
      localStorage.setItem("selectedUser", JSON.stringify(passedUser));
    }
  }, [passedUser]);

  useEffect(() => {
    const fetchSelectedUser = async () => {
      try {
        const res = await fetch(`${BASE_URL}/users/${id}`);
        const data = await res.json();
        if (res.ok && data?.user) {
          setSelectedUser(data.user);
        }
      } catch (err) {
        console.error("❌ Error fetching selected user:", err);
      }
    };
    if (!passedUser && id) fetchSelectedUser();
  }, [id, passedUser]);

  useEffect(() => {
    if (!currentUserId || !selectedUser?._id) return;

    socket.emit("addUser", currentUserId);

    const handleIncomingMessage = (msg) => {
      if (
        (msg.senderId === selectedUser._id && msg.receiverId === currentUserId) ||
        (msg.senderId === currentUserId && msg.receiverId === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, { ...msg, createdAt: new Date().toISOString() }]);
      }
    };

    socket.on("getMessage", handleIncomingMessage);

    socket.on("typing", (senderId) => {
      if (senderId === selectedUser._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BASE_URL}/messages/${currentUserId}/${selectedUser._id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();

    return () => {
      socket.off("getMessage", handleIncomingMessage);
      socket.off("typing");
    };
  }, [currentUserId, selectedUser?._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUserId || !selectedUser?._id) return;

    const msg = {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: trimmed,
    };

    setIsSending(true);
    socket.emit("sendMessage", msg);

    try {
      const res = await fetch(`${BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error("❌ Error saving message to DB:", err);
    }

    setText("");
    setIsSending(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp || isNaN(Date.parse(timestamp))) return "Invalid Time";
    const date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">{selectedUser?.user_id || "Unknown User"}</div>

      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.senderId === currentUserId ? "me" : "you"}`}>
            <div>{m.text}</div>
            <div className="timestamp">{formatTime(m.createdAt)}</div>
          </div>
        ))}
        {isTyping && <div className="typing-indicator">Typing...</div>}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type something..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            socket.emit("typing", {
              senderId: currentUserId,
              receiverId: selectedUser._id,
            });
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend} disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Message;

