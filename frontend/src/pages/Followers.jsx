import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./Followers.css";
import { useNavigate, useParams } from "react-router-dom";

const Followers = () => {
  const [followers, setFollowers] = useState([]);
  const navigate = useNavigate();
  const { userId } = useParams(); // 👈 get userId from URL

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const finalUserId = userId || storedUser?._id;

    if (!finalUserId) return;

    const fetchFollowers = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/users/${finalUserId}`);
        const acceptedFollowers = (res.data.user.followers || []).filter(f => f.status === "accepted");
        setFollowers(acceptedFollowers);
      } catch (error) {
        console.error("Error fetching followers:", error);
      }
    };

    fetchFollowers();
  }, [userId]);

  return (
    <div className="followers-wrapper">
      <h2>Followers</h2>
      {followers.length === 0 ? (
        <p>No followers yet.</p>
      ) : (
        <ul>
          {followers.map((f, i) => (
            <li key={i} onClick={() => navigate(`/profile/${typeof f.user === "object" ? f.user._id : f.user}`)}>
              {typeof f.user === "object" ? f.user.user_id : f.user}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Followers;

