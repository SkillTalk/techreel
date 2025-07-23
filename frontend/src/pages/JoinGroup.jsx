import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./JoinGroup.css";

const JoinGroup = () => {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
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
        const res = await fetch(`/api/groups/${groupId}/join-request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}), // Add userId if needed
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

  const publicGroups = filteredGroups.filter(group => !group.isPrivate);
  const privateGroups = filteredGroups.filter(group => group.isPrivate);

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
    {group.admin && <p>👑 Admin: {group.admin.name}</p>}
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
    {group.admin && <p>👑 Admin: {group.admin.name}</p>}
    <button
      onClick={() =>
        handleJoin(group._id, true, group.members.length >= group.maxMembers)
      }
      disabled={group.members.length >= group.maxMembers}
    >
      {group.members.length >= group.maxMembers ? "Full" : "Request Access"}
    </button>
  </div>
))}


	      </div>
        </div>
      )}
    </div>
  );
};

export default JoinGroup;

