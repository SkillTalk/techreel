  import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./JoinGroup.css";

const JoinGroup = () => {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        console.log("🔍 Fetching groups from:", `${BASE_URL}/groups`);
        const res = await fetch(`${BASE_URL}/groups`);
        const data = await res.json();
        console.log("🔍 Groups fetched:", data);
        setGroups(data);
      } catch (err) {
        console.error("❌ Failed to fetch groups:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const handleJoin = async (groupId, isPrivate, isFull) => {
    if (isFull) {
      alert("Group is full. Please try another group.");
      return;
    }

    if (isPrivate) {
      try {
        const res = await fetch(`${BASE_URL}/groups/${groupId}/join-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: JSON.parse(localStorage.getItem("user"))?._id }),
        });

        if (res.ok) {
          alert("Join request sent to the group admin.");
        } else {
          alert("Failed to send join request.");
        }
      } catch (err) {
        console.error("Error sending join request:", err);
        alert("An error occurred.");
      }
    } else {
      navigate(`/match/room/${groupId}`);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const publicGroups = filteredGroups.filter(group => group.isPublic !== false);
  const privateGroups = filteredGroups.filter(group => group.isPublic === false);

  const me = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();

  const isAdmin = (group) => me && group?.adminId && (group.adminId._id ? group.adminId._id === me._id : String(group.adminId) === String(me._id));

  const deleteGroup = async (groupId) => {
    if (!me?._id) return alert("Not authorized");
    if (!window.confirm("Delete this group? This cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE_URL}/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: me._id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGroups((prev) => prev.filter(g => g._id !== groupId));
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (e) {
      alert('Failed to delete');
    }
  };

  const approveAll = async (groupId) => {
    if (!me?._id) return;
    try {
      const res = await fetch(`${BASE_URL}/groups/${groupId}/approve-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: me._id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Approved ${data.approved} requests`);
      } else {
        alert(data.message || 'Failed to approve');
      }
    } catch (e) {
      alert('Failed to approve');
    }
  };

  return (
    <div className="join-container">
      <h1 className="join-title">🚀 Join a Group</h1>
      <p className="join-subtitle">Browse public and private groups below</p>

      <input
        type="text"
        placeholder="🔍 Search groups"
        className="group-search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading ? (
        <p className="join-loading">⏳ Loading groups...</p>
      ) : (
        <div className="group-sections">
          <div className="group-column">
            <h2>Public Groups</h2>
         {publicGroups.map(group => (
  <div className="group-card" key={group._id}>
    <h3>{group.name}</h3>
    <p>👥 Members: {group.members.length} / {group.maxMembers}</p>
    {group.adminId && <p>👑 Admin: {group.adminId.user_id}</p>}
    {isAdmin(group) && (
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button onClick={() => deleteGroup(group._id)} style={{ background:'#ef4444', color:'#fff' }}>Delete</button>
      </div>
    )}
    <button onClick={() =>
      handleJoin(group._id, false, group.members.length >= group.maxMembers)
    }>
      Join Now
    </button>
  </div>
))}


	      </div>

          <div className="group-column">
            <h2>Private Groups</h2>
          {privateGroups.map(group => (
  <div className="group-card" key={group._id}>
    <h3>{group.name}</h3>
    <p>👥 Members: {group.members.length} / {group.maxMembers}</p>
    {group.adminId && <p>👑 Admin: {group.adminId.user_id}</p>}
    {isAdmin(group) && (
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button onClick={() => deleteGroup(group._id)} style={{ background:'#ef4444', color:'#fff' }}>Delete</button>
      </div>
    )}
    {isAdmin(group) ? (
      <button onClick={() => navigate(`/match/room/${group._id}`)}>Join Group</button>
    ) : (
      <button
        onClick={() =>
          handleJoin(group._id, true, group.members.length >= group.maxMembers)
        }
        disabled={group.members.length >= group.maxMembers}
      >
        {group.members.length >= group.maxMembers ? "Full" : "Request Access"}
      </button>
    )}
  </div>
))}


	      </div>
        </div>
      )}
    </div>
  );
};

export default JoinGroup;

