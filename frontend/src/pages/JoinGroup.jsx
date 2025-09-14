  import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./JoinGroup.css";

const JoinGroup = () => {
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all"); // all | public | private | paid
  const [membership, setMembership] = useState({}); // groupId -> { isActive, expiresAt }
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (type !== "all") params.set("type", type);
        if (searchTerm.trim()) params.set("q", searchTerm.trim());
        const url = `${BASE_URL}/groups${params.toString() ? `?${params.toString()}` : ""}`;
        console.log("🔍 Fetching groups from:", url);
        setLoading(true);
        const res = await fetch(url);
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
    const onFocus = () => fetchGroups();
    const onVis = () => { if (document.visibilityState === 'visible') fetchGroups(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [category, type, searchTerm]);

  // After groups load, query membership status for paid groups
  useEffect(() => {
    const me = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();
    if (!me?._id || !groups?.length) return;
    const paidGroups = groups.filter((g) => g.isPaid);
    if (!paidGroups.length) { setMembership({}); return; }
    let cancelled = false;
    (async () => {
      try {
        // Prefill optimistic state from localStorage (instant UX after payment)
        const optimistic = {};
        const now = Date.now();
        for (const g of paidGroups) {
          try {
            const exp = localStorage.getItem(`paid:${g._id}`);
            if (exp) {
              const ts = new Date(exp).getTime();
              if (!Number.isNaN(ts) && ts > now) {
                optimistic[g._id] = { isActive: true, expiresAt: exp };
              }
            }
          } catch {}
        }
        if (Object.keys(optimistic).length) setMembership((prev) => ({ ...prev, ...optimistic }));

        const results = await Promise.all(
          paidGroups.map(async (g) => {
            const res = await fetch(`${BASE_URL}/groups/${g._id}/status?userId=${me._id}`);
            const data = await res.json();
            console.log(`🔍 Membership status for group ${g.name}:`, data);
            return [g._id, data?.success ? { isActive: data.isActive, expiresAt: data.expiresAt } : { isActive: false }];
          })
        );
        if (!cancelled) {
          const map = Object.fromEntries(results);
          console.log('🔍 Updated membership map:', map);
          setMembership((prev) => ({ ...prev, ...map }));
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [groups]);

  // Listen for instant payment success to flip UI without reload
  useEffect(() => {
    const onPaid = (e) => {
      const { groupId, expiresAt } = e.detail || {};
      if (!groupId) return;
      setMembership((prev) => ({ ...prev, [groupId]: { isActive: true, expiresAt } }));
      try {
        const me = JSON.parse(localStorage.getItem('user'));
        setTimeout(() => {
          fetch(`${BASE_URL}/groups/${groupId}/status?userId=${me?._id}`)
            .then(r => r.json())
            .then(d => { if (d?.success) setMembership((prev) => ({ ...prev, [groupId]: { isActive: d.isActive, expiresAt: d.expiresAt } })); });
        }, 800);
      } catch {}
    };
    window.addEventListener('paid-join-success', onPaid);
    return () => window.removeEventListener('paid-join-success', onPaid);
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

  const isActiveForMe = (group) => {
    const entry = membership[group._id];
    console.log(`🔍 Checking isActiveForMe for group ${group.name}:`, { entry, groupId: group._id });
    if (entry?.isActive) {
      console.log(`✅ User is active via membership state for group ${group.name}`);
      return true;
    }
    const uid = me?._id;
    if (!uid) {
      console.log(`❌ No user ID found for group ${group.name}`);
      return false;
    }
    const mem = (group.members || []).find((m) => {
      const mid = m?.user?._id ? m.user._id : String(m.user || "");
      return String(mid) === String(uid);
    });
    console.log(`🔍 Found member in group.members for group ${group.name}:`, mem);
    if (!mem) {
      console.log(`❌ User not found in group.members for group ${group.name}`);
      return false;
    }
    if (!group.isPaid) {
      console.log(`✅ Group ${group.name} is not paid, user has access`);
      return true;
    }
    if (!mem.expiresAt) {
      console.log(`❌ No expiresAt for paid group ${group.name}`);
      return false;
    }
    const isExpired = new Date(mem.expiresAt).getTime() > Date.now();
    console.log(`🔍 Expiry check for group ${group.name}: expiresAt=${mem.expiresAt}, isExpired=${!isExpired}`);
    return isExpired;
  };

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

  const handleAutoVerify = async (groupId) => {
    if (!me?._id) return alert("Please login first");
    
    try {
      console.log('🔍 Auto verification for group:', groupId);
      
      // Show loading state
      setLoading(true);
      
      // Call automatic verification endpoint
      const verifyRes = await fetch(`${BASE_URL}/payments/auto-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          userId: me._id
        })
      });
      
      const verifyData = await verifyRes.json();
      
      if (verifyRes.ok && verifyData.success) {
        // Update membership status
        setMembership(prev => ({
          ...prev,
          [groupId]: { isActive: true, expiresAt: verifyData.expiresAt }
        }));
        
        alert('Payment verified automatically! Access granted.');
      } else {
        alert(verifyData.message || 'No payment found. Please make a payment first.');
      }
      
    } catch (e) {
      console.error('❌ Auto verification error:', e);
      alert('Verification failed. Please try again or contact support.');
    } finally {
      setLoading(false);
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
      <h1 className="join-title">🚀 Join a Skill Room</h1>
      <p className="join-subtitle">Explore by category, privacy, or paid access</p>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="🔍 Search groups"
          className="group-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="chip-row">
          {[
            { key: "all", label: "All" },
            { key: "education", label: "Educational" },
            { key: "music", label: "Musical" },
            { key: "politics", label: "Political" },
            { key: "property", label: "Property" },
            { key: "technology", label: "Technology" },
            { key: "health", label: "Health" },
            { key: "art", label: "Art" },
            { key: "sports", label: "Sports" },
            { key: "finance", label: "Finance" },
          ].map((c) => (
            <button
              key={c.key}
              className={`chip ${category === c.key ? "active" : ""}`}
              onClick={() => setCategory(c.key)}
            >{c.label}</button>
          ))}
        </div>
        <div className="type-toggle">
          {[
            { k: "all", t: "All" },
            { k: "public", t: "Public" },
            { k: "private", t: "Private" },
            { k: "paid", t: "Paid" },
          ].map((item) => (
            <button
              key={item.k}
              className={`pill ${type === item.k ? "active" : ""}`}
              onClick={() => setType(item.k)}
            >{item.t}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="join-loading">⏳ Loading groups...</p>
      ) : (
        <div className="group-sections">
          <div className="group-column">
            <h2>Public Groups</h2>
         {publicGroups.map(group => (
  <div className="group-card" key={group._id}>
    <h3>{group.name}</h3>
    <div className="badges">
      <span className="badge green">Public</span>
      {group.category && <span className="badge gray">{group.category}</span>}
    </div>
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
            <h2>Private & Paid Groups</h2>
          {privateGroups.map(group => (
  <div className="group-card" key={group._id}>
    <h3>{group.name}</h3>
    <div className="badges">
      {group.isPaid ? (
        <>
          <span className="badge gold">Paid {group.price ? `• ${group.currency || 'INR'} ${group.price}` : ""}</span>
          {membership[group._id]?.isActive && <span className="badge cyan">Subscribed</span>}
        </>
      ) : (
        <span className="badge purple">Private</span>
      )}
      {group.category && <span className="badge gray">{group.category}</span>}
    </div>
    <p>👥 Members: {group.members.length} / {group.maxMembers}</p>
    {group.adminId && <p>👑 Admin: {group.adminId.user_id}</p>}
    {isAdmin(group) && (
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        <button onClick={() => deleteGroup(group._id)} style={{ background:'#ef4444', color:'#fff' }}>Delete</button>
      </div>
    )}
    {isAdmin(group) ? (
      <button onClick={() => navigate(`/match/room/${group._id}`)}>Join Group</button>
    ) : group.isPaid ? (
      isActiveForMe(group) ? (
        <button onClick={() => navigate(`/match/room/${group._id}`)}>Join Now</button>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <Link to={`/pay/${group._id}`} className="link-btn">
            <button>Pay to Join</button>
          </Link>
          <button 
            onClick={() => handleAutoVerify(group._id)}
            disabled={loading}
            style={{ 
              background: loading ? '#6b7280' : '#10b981', 
              color: 'white', 
              border: 'none', 
              padding: '8px 12px', 
              borderRadius: '6px',
              fontSize: '12px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verifying...' : 'Already Paid? Verify Access'}
          </button>
        </div>
      )
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

