import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import all page components
import LandingPage from "./pages/LandingPage";
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
import HomeFeed from "./pages/HomeFeed";
import BottomNav from "./components/BottomNav";
import Match from "./pages/Match";
import CreateGroup from "./pages/CreateGroup";
import JoinGroup from "./pages/JoinGroup";
import GroupRoom from "./pages/GroupRoom";
import PrivateRedirect from "./pages/PrivateRedirect";
import PostDetails from "./pages/PostDetails";


function App() {
  return (
    <Router>
<Routes>
  {/* 🔁 This is the fix */}
  <Route path="/" element={<PrivateRedirect />} />
  <Route path="/home" element={<HomeFeed />} />

  {/* Auth Pages */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />

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
  <Route path="/inbox" element={<Inbox />} />
  <Route path="/landing" element={<LandingPage />} />
<Route path="/match" element={<Match />} />
<Route path="/match/create" element={<CreateGroup />} />
<Route path="/match/join" element={<JoinGroup />} />
<Route path="/match/room/:groupId" element={<GroupRoom />} />
<Route path="/match/group/:groupId" element={<GroupRoom />} />

  {/* ✅ Real-Time Messaging Route */}
  <Route path="/message/:id" element={<Message />} />
  <Route path="/post/:postId" element={<PostDetails />} />
</Routes>

      {/* Toast Notifications */}
      <ToastContainer position="top-center" autoClose={3000} />
      {/* Bottom Navigation */}
      <BottomNav />
    </Router>
  );
}

export default App;

