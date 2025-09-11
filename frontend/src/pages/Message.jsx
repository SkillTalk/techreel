import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { SOCKET_URL, BASE_URL } from "../utils/api";
import "./message.css";

const socket = io(SOCKET_URL, { path: "/socket.io" });

const Message = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedUser = location.state?.selectedUser || JSON.parse(localStorage.getItem("selectedUser"));

  const [selectedUser, setSelectedUser] = useState(passedUser || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;

  useEffect(() => {
    if (passedUser) {
      try {
        localStorage.setItem("selectedUser", JSON.stringify(passedUser));
      } catch (e) {
        try { sessionStorage.setItem("selectedUser", JSON.stringify(passedUser)); } catch {}
      }
      setSelectedUser(passedUser);
      setLoading(false);
    }
  }, [passedUser]);

  useEffect(() => {
    const fetchSelectedUser = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/users/${id}`);
        const data = await res.json();
        if (res.ok && data?.user) {
          setSelectedUser(data.user);
          try {
            localStorage.setItem("selectedUser", JSON.stringify(data.user));
          } catch (e) {
            try { sessionStorage.setItem("selectedUser", JSON.stringify(data.user)); } catch {}
          }
        } else {
          console.error("❌ User not found");
        }
      } catch (err) {
        console.error("❌ Error fetching selected user:", err);
      } finally {
        setLoading(false);
      }
    };
    if (!passedUser && id) {
      fetchSelectedUser();
    }
  }, [id, passedUser]);

  useEffect(() => {
    if (!currentUserId || !selectedUser?._id) {
      setLoading(true);
      return;
    }
    setLoading(false);

    socket.emit("addUser", currentUserId);

    const handleIncomingMessage = (msg) => {
      // Only process messages from other users to prevent duplicates
      if (msg.senderId === selectedUser._id && msg.receiverId === currentUserId) {
        // Check if message already exists to prevent duplicates
        setMessages((prev) => {
          const messageExists = prev.some(m => 
            m.text === msg.text && 
            m.senderId === msg.senderId && 
            m.receiverId === msg.receiverId &&
            Math.abs(new Date(m.timestamp || m.createdAt) - new Date(msg.timestamp || Date.now())) < 5000 // Within 5 seconds
          );
          
          if (messageExists) {
            return prev;
          }
          
          return [...prev, { ...msg, timestamp: msg.timestamp || Date.now() }];
        });
      }
    };

    socket.on("getMessage", (msg) => {
      // Skip messages that the current user just sent (prevent echo)
      if (msg.senderId === currentUserId) {
        return;
      }
      
      handleIncomingMessage(msg);
    });

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
          // Ensure all messages have proper timestamps
          const messagesWithTimestamps = data.map(msg => ({
            ...msg,
            timestamp: msg.createdAt || msg.timestamp || new Date().toISOString()
          }));
          setMessages(messagesWithTimestamps);
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
    if (!trimmed || !currentUserId || !selectedUser._id) return;

    const msg = {
      senderId: currentUserId,
      receiverId: selectedUser._id,
      text: trimmed,
      timestamp: new Date().toISOString(), // Use ISO string format for consistency
      tempId: `temp_${Date.now()}_${Math.random()}`, // Temporary ID for deduplication
    };

    setIsSending(true);
    
    // Add message optimistically to UI immediately
    setMessages((prev) => [...prev, msg]);
    
    // Clear input immediately for better UX
    setText("");
    
    // Emit socket event
    socket.emit("sendMessage", msg);

    try {
      // Save to database
      const res = await fetch(`${BASE_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: selectedUser._id,
          text: trimmed,
        }),
      });
      
              if (res.ok) {
          const data = await res.json();
          // Replace temporary message with real one from database
          setMessages((prev) => 
            prev.map(m => 
              m.tempId === msg.tempId ? { 
                ...data, 
                timestamp: data.createdAt || data.timestamp || m.timestamp 
              } : m
            )
          );
        }
    } catch (err) {
      console.error("❌ Error saving message to DB:", err);
      // Remove the temporary message if save failed
      setMessages((prev) => prev.filter(m => m.tempId !== msg.tempId));
    }

    setIsSending(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "No time";
    
    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return "Invalid time";
    }
    
    if (isNaN(date.getTime())) {
      return "Invalid time";
    }
    
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="message-container">
        <div className="message-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="header-info">
            <div className="user-avatar">
              <div className="avatar-placeholder">L</div>
            </div>
            <div className="user-details">
              <h3>Loading...</h3>
              <p>Connecting...</p>
            </div>
          </div>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="message-container">
        <div className="message-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="header-info">
            <div className="user-avatar">
              <div className="avatar-placeholder">?</div>
            </div>
            <div className="user-details">
              <h3>User Not Found</h3>
              <p>Error</p>
            </div>
          </div>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>User not found</h3>
          <p>The user you're trying to message doesn't exist or has been removed.</p>
          <button className="retry-btn" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="message-container">
      {/* Header */}
      <div className="message-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <div className="header-info">
          <div className="user-avatar">
            <img
              src={
                selectedUser?.profileImage?.trim()
                  ? selectedUser.profileImage
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser?.user_id || 'U')}&background=6366f1&color=fff&size=40`
              }
              alt={selectedUser?.user_id || 'User'}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="avatar-placeholder" style={{ display: 'none' }}>
              {selectedUser?.user_id?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="online-indicator"></div>
          </div>
          
          <div className="user-details">
            <h3>@{selectedUser?.user_id || "Unknown User"}</h3>
            <p className="user-status">
              {selectedUser?.profession ? `${selectedUser.profession}` : 'Active now'}
            </p>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="action-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Start a conversation</h3>
              <p>Send a message to begin chatting with @{selectedUser?.user_id}</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={m._id || m.tempId || `${m.senderId}_${m.timestamp}_${m.text}`} className={`message-wrapper ${m.senderId === currentUserId ? "sent" : "received"}`}>
                <div className="message-bubble">
                  {m.mediaUrl ? (
                    m.mediaType === 'image' ? (
                      <img src={m.mediaUrl} alt={m.fileName || 'attachment'} className="msg-media" />
                    ) : m.mediaType === 'video' ? (
                      <video src={m.mediaUrl} controls playsInline preload="metadata" className="msg-media" />
                    ) : (
                      <a href={m.mediaUrl} download={m.fileName || 'file'} target="_blank" rel="noreferrer" className="msg-file">
                        {m.fileName || 'Download file'}
                      </a>
                    )
                  ) : (
                    <div className="message-content">{m.text}</div>
                  )}
                  <div className="message-meta">
                    <span className="timestamp">{formatTime(m.timestamp || m.createdAt)}</span>
                    {m.senderId === currentUserId && (
                      <span className="message-status">
                        {m.tempId ? '⏳' : '✓✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">typing...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="message-input-container">
        <div className="input-wrapper">
          <input id="fileInput" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" style={{ display:'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              // Convert to base64 for quick send (or integrate upload service)
              const toBase64 = (f) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(f); });
              const mediaUrl = await toBase64(file);
              const mediaType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
              const payload = { senderId: currentUserId, receiverId: selectedUser._id, text: '', mediaUrl, mediaType, fileName: file.name, fileSize: file.size };
              // Optimistically add media message
              const tempMsg = { ...payload, tempId: `temp_${Date.now()}`, timestamp: new Date().toISOString() };
              setMessages((prev) => [...prev, tempMsg]);
              socket.emit('sendMessage', tempMsg);
              const res = await fetch(`${BASE_URL}/messages`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
              if (res.ok) {
                const saved = await res.json();
                setMessages((prev) => prev.map(m => m.tempId === tempMsg.tempId ? saved : m));
              }
            } catch (err) {
              console.error('❌ File attach failed', err);
            } finally {
              e.target.value = '';
            }
          }} />
          <button className="attach-btn" onClick={() => document.getElementById('fileInput').click()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
            </svg>
          </button>
          
          <div className="input-field">
            <input
              type="text"
              placeholder="Type a message..."
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
          </div>
          
          <button 
            className={`send-btn ${text.trim() ? 'active' : ''}`}
            onClick={handleSend} 
            disabled={isSending || !text.trim()}
          >
            {isSending ? (
              <div className="sending-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22,2 15,22 11,13 2,9 22,2"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Message;

