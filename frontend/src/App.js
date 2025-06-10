import React from "react";
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

export default App;
