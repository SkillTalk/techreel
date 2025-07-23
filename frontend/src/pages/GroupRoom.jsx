// ✅ FULLY UPDATED GroupRoom.jsx with Real-Time Voice Calling Integration

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { BASE_URL, SOCKET_URL } from "../utils/api";
import "./GroupRoom.css";

const socket = io(SOCKET_URL, { transports: ["websocket"] });

const GroupRoom = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;
  const chatEndRef = useRef(null);
  const isVoluntaryLeave = useRef(false);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const [peers, setPeers] = useState({});
  const peersRef = useRef([]);
  const userAudioRef = useRef();

  const isAdmin = group?.adminId === currentUserId;

  useEffect(() => {
    if (currentUserId) socket.emit("addUser", currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    const handleKicked = (data) => {
      if (data.groupId === groupId && !isVoluntaryLeave.current) {
        alert("🚫 You have been removed from this group.");
        navigate("/match");
      }
    };
    socket.on("kickedFromGroup", handleKicked);
    return () => socket.off("kickedFromGroup", handleKicked);
  }, [groupId, navigate]);

  useEffect(() => {
    const initializeGroupRoom = async () => {
      try {
        socket.emit("joinGroup", groupId);

        await fetch(`${BASE_URL}/groups/${groupId}/add-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        });

        const resGroup = await fetch(`${BASE_URL}/groups/${groupId}`);
        const groupData = await resGroup.json();
        setGroup(groupData);

        const resMessages = await fetch(`${BASE_URL}/groups/group/messages/${groupId}`);
        const messageData = await resMessages.json();
        setMessages(messageData);
      } catch (err) {
        console.error("❌ Error initializing group room:", err);
      }
    };
    initializeGroupRoom();
  }, [groupId, currentUserId]);

  useEffect(() => {
    const handleReceive = (msg) => setMessages((prev) => [...prev, msg]);
    socket.on("receiveGroupMessage", handleReceive);
    return () => socket.off("receiveGroupMessage", handleReceive);
  }, []);

  useEffect(() => {
    const handleMemberJoined = (updatedGroup) => {
      setGroup(updatedGroup);
      const newUser = updatedGroup.members[updatedGroup.members.length - 1];
      if (newUser.user._id !== currentUserId) {
        console.log(`${newUser.user.user_id} joined the group.`);
      }
    };
    socket.on("memberJoined", handleMemberJoined);
    return () => socket.off("memberJoined", handleMemberJoined);
  }, [currentUserId]);

  // 🔊 Real-time Voice Setup
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      userAudioRef.current.srcObject = stream;

      socket.emit("join-voice-room", { groupId, userId: currentUserId });

      socket.on("all-users", (users) => {
        const newPeers = {};
        users.forEach((userId) => {
          const peer = createPeer(userId, socket.id, stream);
          const audioRef = React.createRef();
          peersRef.current.push({ peerId: userId, peer });
          newPeers[userId] = { peer, audioRef };
        });
        setPeers(newPeers);
      });

      socket.on("user-joined", ({ callerId, signal }) => {
        const peer = addPeer(signal, callerId, stream);
        const audioRef = React.createRef();
        peersRef.current.push({ peerId: callerId, peer });
        setPeers((prev) => ({ ...prev, [callerId]: { peer, audioRef } }));
      });

      socket.on("receiving-returned-signal", ({ id, signal }) => {
        const item = peersRef.current.find((p) => p.peerId === id);
        item?.peer.signal(signal);
      });
    });
  }, []);

  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerId, signal });
    });
    peer.on("stream", (stream) => {
      const ref = peers[userToSignal]?.audioRef;
      if (ref?.current) ref.current.srcObject = stream;
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerId });
    });
    peer.on("stream", (stream) => {
      const ref = peers[callerId]?.audioRef;
      if (ref?.current) ref.current.srcObject = stream;
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const msg = { senderId: currentUserId, groupId, text: text.trim() };
    setIsSending(true);
    setText("");
    socket.emit("sendGroupMessage", msg);
    setIsSending(false);
  };

  const handleLeaveGroup = async () => {
    try {
      isVoluntaryLeave.current = true;
      await fetch(`${BASE_URL}/groups/${groupId}/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      navigate("/match");
    } catch (err) {
      console.error("❌ Failed to leave group:", err);
    }
  };

  const handleKickUser = async (userIdToKick) => {
    if (!isAdmin) return;
    try {
      await fetch(`${BASE_URL}/groups/${groupId}/remove-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userIdToKick, byAdmin: true }),
      });
      if (userIdToKick === currentUserId) navigate("/match");
      else {
        const updated = await fetch(`${BASE_URL}/groups/${groupId}`);
        const data = await updated.json();
        setGroup(data);
      }
    } catch (err) {
      console.error("❌ Kick failed:", err);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatExpanded]);

  const formatTime = (timestamp) => {
    if (!timestamp || isNaN(Date.parse(timestamp))) return "Invalid Time";
    const date = new Date(timestamp);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const getProfileImage = (imgPath) =>
    imgPath && imgPath !== "null" && imgPath.trim() !== ""
      ? imgPath
      : "/assets/signup_page.png";

  return (
    <div className="group-room-container">
      <aside className="sidebar">
        <h3>Members</h3>
        <div className="members-scroll">
          {group?.members?.map((member, index) => (
            <div key={index} className="member-item">
              <img src={getProfileImage(member.user?.profileImage)} alt="avatar" />
              <span>
                {member.user?.user_id}
                {group?.adminId === member.user?._id ? " (Admin)" : ""}
              </span>
              {isAdmin && member.user?._id !== currentUserId && (
                <button onClick={() => handleKickUser(member.user._id)} style={{ marginLeft: "auto", background: "#e74c3c", border: "none", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}>Kick</button>
              )}
            </div>
          ))}
        </div>

        <button className="sidebar-btn" onClick={() => setChatExpanded((s) => !s)}>
          💬 Chat
        </button>

        {chatExpanded && (
          <div className="embedded-chat-panel">
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={m._id || i} className={`message ${m.senderId?._id === currentUserId ? "me" : "you"}`}>
                  <strong>{m.senderId?.user_id || "Unknown"}:</strong> {m.text}
                  <div className="timestamp">{formatTime(m.createdAt)}</div>
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </div>
            <div className="chat-input">
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Type a message..." />
              <button onClick={handleSend} disabled={isSending}>{isSending ? "..." : "Send"}</button>
            </div>
          </div>
        )}
      </aside>

      <main className="main-section">
        <section className="video-grid">
          <audio ref={userAudioRef} autoPlay muted />
          {Object.entries(peers).map(([peerId, { audioRef }]) => (
            <audio key={peerId} ref={audioRef} autoPlay />
          ))}

          {group?.members?.slice(0, 3).map((member, index) => (
            <div key={index} className="tile">
              <img src={getProfileImage(member.user?.profileImage)} alt="profile" className="video-avatar" />
              <div className="member-name">
                {member.user?.user_id}
                {group?.adminId === member.user?._id ? " (Admin)" : ""}
              </div>
            </div>
          ))}
        </section>

        <footer className="controls">
          <button title="Camera">🎥</button>
          <button title="Mic">🎤</button>
          <button title="Screen">🖥️</button>
          <button title="Record">⏺️</button>
          <button className="leave-btn" onClick={handleLeaveGroup}>Leave</button>
        </footer>
      </main>
    </div>
  );
};

export default GroupRoom;

