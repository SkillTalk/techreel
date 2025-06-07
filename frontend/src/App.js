import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function App() {
  const userData = {
    username: "gautam.kumar",
    name: "Gautam Kumar",
    profilePicture: "https://i.imgur.com/xyz.png",
    bio: "Software Engineer | Passionate about AI, DevOps & Web3.",
    website: "https://gautam.tech",
    posts: 45,
    followers: 1200,
    following: 350,
    highlights: ["Projects", "Certifications", "Hobbies"],
    gallery: [
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
      "https://via.placeholder.com/300",
    ],
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile user={userData} />} />
      </Routes>
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  );
}

export default App;
