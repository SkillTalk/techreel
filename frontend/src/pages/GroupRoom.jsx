// ✅ FULLY UPDATED GroupRoom.jsx with Real-Time Voice Calling Integration

import { useState, useEffect, useRef, useCallback, createRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer-light";
import { BASE_URL, SOCKET_URL } from "../utils/api";
import "./GroupRoom.css";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  path: "/socket.io",
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

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
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [peers, setPeers] = useState({});
  const [showPending, setShowPending] = useState(true);
  const peersRef = useRef([]);
  const userAudioRef = useRef();
  const userVideoRef = useRef();
  const userStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  const isAdmin = !!(group && currentUserId && (String(group.adminId?._id || group.adminId) === String(currentUserId)));

  useEffect(() => {
    if (currentUserId) socket.emit("addUser", currentUserId);
  }, [currentUserId]);

  // Listen for join requests if you are the admin
  useEffect(() => {
    const handler = ({ groupId: gId, requesterId }) => {
      if (gId === groupId && isAdmin) {
        alert("Join request received. Approve from Join Group page.");
      }
    };
    socket.on("group-join-request", handler);
    return () => socket.off("group-join-request", handler);
  }, [groupId, isAdmin]);

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

        // Fire-and-forget membership add to avoid blocking UI
        fetch(`${BASE_URL}/groups/${groupId}/add-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }).catch(() => {});

        // Fetch group and messages in parallel for faster first paint
        const [groupRes, msgsRes] = await Promise.all([
          fetch(`${BASE_URL}/groups/${groupId}`),
          fetch(`${BASE_URL}/groups/group/messages/${groupId}`),
        ]);
        const [groupData, messageData] = await Promise.all([
          groupRes.json(),
          msgsRes.json(),
        ]);
        setGroup(groupData);
        setMessages(Array.isArray(messageData) ? messageData : []);
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
    const initializeVoiceCall = async () => {
      try {
        // Request both audio and video permissions
        const userStream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 24, max: 30 },
            facingMode: "user"
          } 
        });

        // Store stream reference for other functions
        userStreamRef.current = userStream;

        // Set up local video and audio
        if (userAudioRef.current) userAudioRef.current.srcObject = userStream;
        if (userVideoRef.current) userVideoRef.current.srcObject = userStream;

        // Join voice room
        socket.emit("join-voice-room", { groupId, userId: currentUserId });

        // Handle existing users in the room
        socket.on("all-users", (users) => {
          console.log("🎤 Users in voice room:", users);
          const newPeers = {};
          users.forEach((userId) => {
            if (userId !== currentUserId) {
              const peer = createPeer(userId, socket.id, userStream);
              const audioRef = createRef();
              const videoRef = createRef();
              peersRef.current.push({ peerId: userId, peer });
              newPeers[userId] = { peer, audioRef, videoRef };
            }
          });
          setPeers(newPeers);
        }, { passive: true });

        // Handle new user joining
        socket.on("user-joined", ({ callerId, signal }) => {
          console.log("🎤 New user joined voice room:", callerId);
          const peer = addPeer(signal, callerId, userStream);
          const audioRef = createRef();
          const videoRef = createRef();
          peersRef.current.push({ peerId: callerId, peer });
          setPeers((prev) => ({ ...prev, [callerId]: { peer, audioRef, videoRef } }));
        });

        // Handle incoming signals
        socket.on("receiving-returned-signal", ({ id, signal }) => {
          const item = peersRef.current.find((p) => p.peerId === id);
          if (item?.peer) {
            item.peer.signal(signal);
          }
        });

        // Handle user leaving
        socket.on("user-left", (userId) => {
          console.log("🎤 User left voice room:", userId);
          const peerToRemove = peersRef.current.find((p) => p.peerId === userId);
          if (peerToRemove) {
            peerToRemove.peer.destroy();
            peersRef.current = peersRef.current.filter((p) => p.peerId !== userId);
            setPeers((prev) => {
              const newPeers = { ...prev };
              delete newPeers[userId];
              return newPeers;
            });
          }
        });

      } catch (error) {
        console.error("❌ Error accessing media devices:", error);
        alert("Please allow camera and microphone access for voice calling.");
      }
    };

    if (currentUserId && groupId) {
      initializeVoiceCall();
    }

    // Cleanup function
    return () => {
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(({ peer }) => {
        if (peer) peer.destroy();
      });
      socket.off("all-users");
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-left");
    };
  }, [currentUserId, groupId]);

  const createPeer = useCallback((userToSignal, callerId, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerId, signal });
    });
    peer.on("stream", (stream) => {
      const audioRef = peers[userToSignal]?.audioRef;
      const videoRef = peers[userToSignal]?.videoRef;
      if (audioRef?.current) audioRef.current.srcObject = stream;
      if (videoRef?.current) videoRef.current.srcObject = stream;
    });
    return peer;
  }, []);

  const addPeer = useCallback((incomingSignal, callerId, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerId });
    });
    peer.on("stream", (stream) => {
      const audioRef = peers[callerId]?.audioRef;
      const videoRef = peers[callerId]?.videoRef;
      if (audioRef?.current) audioRef.current.srcObject = stream;
      if (videoRef?.current) videoRef.current.srcObject = stream;
    });
    peer.signal(incomingSignal);
    return peer;
  }, []);

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

      const stopStream = (s) => { try { s && s.getTracks().forEach(t => t.stop()); } catch {} };
      // Stop local streams
      stopStream(userStreamRef.current); userStreamRef.current = null;
      stopStream(screenStreamRef.current); screenStreamRef.current = null;
      // Detach from media elements
      if (userVideoRef.current?.srcObject) { stopStream(userVideoRef.current.srcObject); userVideoRef.current.srcObject = null; }
      if (userAudioRef.current?.srcObject) { stopStream(userAudioRef.current.srcObject); userAudioRef.current.srcObject = null; }
      // Stop recording if running
      if (window.currentRecorder) { try { window.currentRecorder.stop(); } catch {} window.currentRecorder = null; }

      // Tear down peers
      try {
        peersRef.current.forEach(({ peer }) => { try { peer && peer.destroy(); } catch {} });
        peersRef.current = [];
        setPeers({});
      } catch {}

      // Leave voice room
      if (socket && groupId && currentUserId) {
        socket.emit("leave-voice-room", { groupId, userId: currentUserId });
      }

      // Remove from group
      if (groupId && currentUserId) {
        await fetch(`${BASE_URL}/groups/${groupId}/remove-member`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        });
      }

      // Navigate away (slight delay ensures OS indicator updates immediately)
      setTimeout(() => navigate("/match"), 150);
    } catch (err) {
      console.error("❌ Failed to leave group:", err);
      // Still navigate away even if there's an error
      navigate("/match");
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

  const toggleMute = () => {
    if (userAudioRef.current?.srcObject) {
      const audioTrack = userAudioRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (userVideoRef.current?.srcObject) {
      const videoTrack = userVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        
        // Replace video stream with screen stream
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = screenStream;
        }
        screenStreamRef.current = screenStream;
        
        setIsScreenSharing(true);
        console.log("🖥️ Screen sharing started");
        
        // Handle screen share stop
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          // Restore camera stream
          if (userVideoRef.current && userStreamRef.current) {
            userVideoRef.current.srcObject = userStreamRef.current;
          }
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
          }
        };
      } else {
        // Stop screen sharing
        if (userVideoRef.current && userStreamRef.current) {
          userVideoRef.current.srcObject = userStreamRef.current;
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        console.log("🖥️ Screen sharing stopped");
      }
    } catch (error) {
      console.error("❌ Screen sharing error:", error);
      alert("Failed to start screen sharing. Please try again.");
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
      try {
        const stream = userVideoRef.current?.srcObject;
        if (stream) {
          const mediaRecorder = new MediaRecorder(stream);
          const chunks = [];
          
          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
          };
          
          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meeting-recording-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
          };
          
          mediaRecorder.start();
          setIsRecording(true);
          console.log("⏺️ Recording started");
          
          // Store recorder for stopping later
          window.currentRecorder = mediaRecorder;
        }
      } catch (error) {
        console.error("❌ Recording error:", error);
        alert("Failed to start recording.");
      }
    } else {
      // Stop recording
      if (window.currentRecorder) {
        window.currentRecorder.stop();
        window.currentRecorder = null;
      }
      setIsRecording(false);
      console.log("⏺️ Recording stopped");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatExpanded]);

  // Cleanup on component unmount: ensure media off
  useEffect(() => {
    return () => {
      const stopStream = (s) => { try { s && s.getTracks().forEach(t => t.stop()); } catch {} };
      stopStream(userStreamRef.current); userStreamRef.current = null;
      stopStream(screenStreamRef.current); screenStreamRef.current = null;
      if (userVideoRef.current?.srcObject) { stopStream(userVideoRef.current.srcObject); userVideoRef.current.srcObject = null; }
      if (userAudioRef.current?.srcObject) { stopStream(userAudioRef.current.srcObject); userAudioRef.current.srcObject = null; }
      if (currentUserId && groupId) {
        socket.emit("leave-voice-room", { groupId, userId: currentUserId });
      }
    };
  }, [currentUserId, groupId]);

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
    <div className="teams-container">
      {/* Header */}
      <header className="teams-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleLeaveGroup}>
            ← Back
          </button>
          <div className="meeting-info">
            <h2>{group?.name || "Group Meeting"}</h2>
            <span className="meeting-status">
              {group?.members?.filter((member, index, self) => 
                index === self.findIndex(m => m.user?._id === member.user?._id)
              ).length || 0} participants
            </span>
          </div>
        </div>
        <div className="header-right">
          <div className="meeting-time">
            <span className="time-display">00:00</span>
          </div>
        </div>
      </header>

      <div className="teams-main">
        {/* Participants Panel */}
        <aside className="participants-panel">
          <div className="panel-header">
            <h3>Participants ({group?.members?.filter((member, index, self) => 
              index === self.findIndex(m => m.user?._id === member.user?._id)
            ).length || 0})</h3>
            <button 
              className="panel-toggle"
              onClick={() => setChatExpanded(!chatExpanded)}
            >
              {chatExpanded ? "📱" : "💬"}
            </button>
          </div>
          
          {isAdmin && group?.joinRequests?.length > 0 && (
            <div className="pending-requests" style={{ marginBottom: 12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Pending Requests</h4>
                <button
                  className="btn"
                  onClick={() => setShowPending(!showPending)}
                  style={{ background:'#f3f4f6', color:'#111827', borderRadius:6, padding:'6px 10px' }}
                  aria-label={showPending ? 'Hide pending requests' : 'Show pending requests'}
                >{showPending ? '🙈 Hide' : '👁 Show'}</button>
              </div>
              {showPending && (
              <div style={{ display: 'grid', gap: 8 }}>
                {group.joinRequests.filter(r => r.status === 'pending').map((r) => (
                  <div key={r._id || r.user?._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <img src={getProfileImage(r.user?.profileImage)} alt="" style={{ width:24, height:24, borderRadius:'50%' }} />
                      <span style={{ fontSize:13, color:'#111827' }}>@{r.user?.user_id}</span>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn" title="Approve" style={{ background:'#16a34a', color:'#fff', borderRadius:6, padding:'6px 10px' }} onClick={async () => {
                        try {
                          await fetch(`${BASE_URL}/groups/${groupId}/approve/${r.user?._id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ adminId: currentUserId }) });
                          const refreshed = await fetch(`${BASE_URL}/groups/${groupId}`);
                          setGroup(await refreshed.json());
                        } catch {}
                      }}>✔️</button>
                      <button className="btn" title="Deny" style={{ background:'#ef4444', color:'#fff', borderRadius:6, padding:'6px 10px' }} onClick={async () => {
                        try {
                          await fetch(`${BASE_URL}/groups/${groupId}/deny/${r.user?._id}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ adminId: currentUserId }) });
                          const refreshed = await fetch(`${BASE_URL}/groups/${groupId}`);
                          setGroup(await refreshed.json());
                        } catch {}
                      }}>✖️</button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          <div className="participants-list">
            {group?.members?.filter((member, index, self) => 
              index === self.findIndex(m => m.user?._id === member.user?._id)
            ).map((member, index) => (
              <div key={member.user?._id || index} className="participant-item">
                <div className="participant-avatar">
                  <img src={getProfileImage(member.user?.profileImage)} alt="avatar" />
                  <div className={`status-indicator ${member.user?._id === currentUserId ? 'online' : 'away'}`}></div>
                </div>
                <div className="participant-info">
                  <span className="participant-name">
                    {member.user?.user_id}
                    {member.user?._id === currentUserId && " (You)"}
                  </span>
                  {group?.adminId === member.user?._id && (
                    <span className="admin-badge">Admin</span>
                  )}
                </div>
                {isAdmin && member.user?._id !== currentUserId && (
                  <button 
                    className="kick-btn"
                    onClick={() => handleKickUser(member.user._id)}
                    title="Remove participant"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Chat Panel */}
          {chatExpanded && (
            <div className="chat-panel">
              <div className="chat-header">
                <h4>Chat</h4>
                <button className="minimize-btn" onClick={() => setChatExpanded(false)}>
                  −
                </button>
              </div>
              <div className="chat-messages">
                {messages.map((m, i) => (
                  <div key={m._id || i} className={`message ${m.senderId?._id === currentUserId ? "sent" : "received"}`}>
                    <div className="message-content">
                      <div className="message-sender">
                        {m.senderId?.user_id || "Unknown"}
                        {m.senderId?._id === currentUserId && " (You)"}
                      </div>
                      <div className="message-text">{m.text}</div>
                      <div className="message-time">{formatTime(m.createdAt)}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>
              <div className="chat-input-container">
                <input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  onKeyDown={(e) => e.key === "Enter" && handleSend()} 
                  placeholder="Type a message..." 
                  className="chat-input"
                />
                <button 
                  onClick={handleSend} 
                  disabled={isSending}
                  className="send-btn"
                >
                  {isSending ? "..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Video Area */}
        <main className="video-main">
          <div className="video-grid">
            {/* Current User Video */}
            <div className="video-tile current-user">
              <video ref={userVideoRef} autoPlay muted className="video-stream" />
              <div className="video-overlay">
                <div className="user-info">
                  <img src={getProfileImage(currentUser?.profileImage)} alt="You" className="user-avatar" />
                  <span className="user-name">You</span>
                </div>
                <div className="video-controls">
                  {isMuted && <div className="mute-indicator">🔇</div>}
                  {!isVideoOn && <div className="video-off-indicator">📹</div>}
                </div>
              </div>
            </div>

            {/* Other Participants */}
            {group?.members?.filter((member, index, self) => 
              index === self.findIndex(m => m.user?._id === member.user?._id)
            ).slice(0, 5).map((member, index) => {
              if (member.user?._id === currentUserId) return null;
              return (
                <div key={member.user?._id || index} className="video-tile">
                  <div className="video-placeholder">
                    <img src={getProfileImage(member.user?.profileImage)} alt="avatar" className="participant-avatar" />
                    <span className="participant-name">{member.user?.user_id}</span>
                    {group?.adminId === member.user?._id && (
                      <span className="admin-badge">Admin</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Control Bar */}
      <footer className="control-bar">
        <div className="control-left">
          <button className="control-btn" onClick={toggleMute}>
            {isMuted ? "🔇" : "🎤"}
          </button>
          <button className="control-btn" onClick={toggleVideo}>
            {isVideoOn ? "📹" : "📹"}
          </button>
        </div>

        <div className="control-center">
          <button className={`control-btn ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare}>
            {isScreenSharing ? "🖥️" : "🖥️"}
          </button>
          <button className={`control-btn ${isRecording ? 'active' : ''}`} onClick={toggleRecording}>
            {isRecording ? "⏺️" : "⏺️"}
          </button>
        </div>

        <div className="control-right">
          <button className="leave-btn" onClick={handleLeaveGroup}>
            Leave
          </button>
        </div>
      </footer>

      {/* Hidden audio elements for peer connections */}
      <audio ref={userAudioRef} autoPlay muted />
      {Object.entries(peers).map(([peerId, { audioRef, videoRef }]) => (
        <div key={peerId}>
          <audio ref={audioRef} autoPlay />
          <video ref={videoRef} autoPlay />
        </div>
      ))}
    </div>
  );
};

export default GroupRoom;