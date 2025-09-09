import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import "./BottomNav.css";

const HIDE_PATHS = new Set(["/login", "/signup", "/landing"]);

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const path = location.pathname;
  const hide = HIDE_PATHS.has(path) || path.startsWith("/message");

  useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        if (!user?._id) return;
        const res = await fetch(`${BASE_URL}/messages/unread-count/${user._id}`);
        const data = await res.json();
        if (active) setUnread(data?.count || 0);
      } catch {}
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 8000);
    return () => { active = false; clearInterval(id); };
  }, [user?._id]);

  const Item = ({ to, icon, label, isActive, badge }) => (
    <button className={`bn-item ${isActive ? "active" : ""}`} onClick={() => navigate(to)} aria-label={label}>
      <span className="bn-icon" aria-hidden>{icon}</span>
      {badge}
      <span className="bn-label">{label}</span>
    </button>
  );

  if (!user || hide) return null;

  return (
    <>
      {/* Spacer to prevent content being covered by fixed nav */}
      <div className="bn-spacer" />
      <nav className="bottom-nav">
      <Item to="/home" label="Home" isActive={path.startsWith("/home")} icon="🏠" />
      <Item to="/search-user" label="Search" isActive={path.startsWith("/search-user")} icon="🔎" />
      <Item
        to="/inbox"
        label="Messages"
        isActive={path.startsWith("/inbox") || path.startsWith("/message")}
        icon="💬"
        badge={unread > 0 ? <span className="bn-dot" /> : null}
      />
      <Item to="/profile" label="Profile" isActive={path.startsWith("/profile") && !path.startsWith("/profile/")} icon="👤" />
      </nav>
    </>
  );
};

export default BottomNav;


