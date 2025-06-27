import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Following.css";
import { useNavigate, useParams } from "react-router-dom";

const Following = () => {
  const [following, setFollowing] = useState([]);
  const navigate = useNavigate();
  const { userId } = useParams(); // 👈 get userId from URL

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const finalUserId = userId || storedUser?._id;

    if (!finalUserId) return;

    const fetchFollowing = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/users/${finalUserId}`);
        const acceptedFollowing = (res.data.user.following || []).filter(f => f.status === "accepted");
        setFollowing(acceptedFollowing);
      } catch (error) {
        console.error("Error fetching following:", error);
      }
    };

    fetchFollowing();
  }, [userId]);

  return (
    <div className="followers-wrapper">
      <h2>Following</h2>
      {following.length === 0 ? (
        <p>Not following anyone yet.</p>
      ) : (
        <ul>
          {following.map((f, i) => (
            <li key={i} onClick={() => navigate(`/profile/${typeof f.user === "object" ? f.user._id : f.user}`)}>
              {typeof f.user === "object" ? f.user.user_id : f.user}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Following;

