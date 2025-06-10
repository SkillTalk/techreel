import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PublicProfile = () => {
  const { id } = useParams(); // userId from the URL
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`);
        setUser(res.data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("User not found");
      }
    };
    fetchUser();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="signup-container">
      <h2>{user.username}'s Public Profile</h2>
      <p>Email: {user.email}</p>
      <p>Bio: {user.bio || "No bio provided."}</p>
      <p>
        Website:{" "}
        <a href={user.website} target="_blank" rel="noreferrer">
          {user.website}
        </a>
      </p>
      {/* Add "Connect" or "Follow" button here in future */}
    </div>
  );
};

export default PublicProfile;
