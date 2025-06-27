/*import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
      </Routes>
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
}

export default App;*/




import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import all page components
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import EditProfile from "./pages/EditProfile";
import SearchUser from "./pages/SearchUser";
import Notifications from "./pages/Notifications";
import Followers from "./pages/Followers";
import Following from "./pages/Following";
import Message from "./pages/Message";
import Inbox from "./pages/Inbox";

// ✅ Wrapper for loading the user to chat with
const MessageWrapper = () => {
  const { userId } = useParams();
  const [selectedUser, setSelectedUser] = useState(null);

  // 🔐 Replace this with your auth logic if needed
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        setSelectedUser(data);
      } catch (err) {
        console.error("❌ Failed to load selected user:", err);
      }
    };

    fetchUser();
  }, [userId]);

  if (!selectedUser) return <div>Loading chat...</div>;

  return (
    <Message currentUserId={currentUserId} selectedUser={selectedUser} />
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Pages */}
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Profile Pages */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:id" element={<PublicProfile />} />

        {/* Modular Profile Sections */}
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/search-user" element={<SearchUser />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/followers" element={<Followers />} />
        <Route path="/followers/:userId" element={<Followers />} />
        <Route path="/following" element={<Following />} />
        <Route path="/following/:userId" element={<Following />} />
        <Route path="/inbox/:userId" element={<Inbox />} />

        {/* ✅ Real-Time Messaging Route */}
        <Route path="/message/:userId" element={<MessageWrapper />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
}

export default App;

