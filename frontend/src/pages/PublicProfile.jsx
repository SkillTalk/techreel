import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PublicProfile = () => {
  const { id } = useParams(); // public userId from the URL
  const [user, setUser] = useState(null); // user being viewed
  const [currentUser, setCurrentUser] = useState(null); // logged-in user
  const [followStatus, setFollowStatus] = useState(null); // "accepted", "pending", or null
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`);
        setUser(res.data.user);

        if (currentUser && res.data.user.followers) {
          const match = res.data.user.followers.find(
            (f) => f.user === currentUser._id || f.user?._id === currentUser._id
          );
          if (match) setFollowStatus(match.status); // "pending" or "accepted"
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("User not found");
      }
    };
    if (id) fetchProfile();
  }, [id, currentUser]);

  const handleFollow = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/users/${id}/follow`,
        {
          senderId: currentUser._id,
        }
      );
      setFollowStatus("pending");
    } catch (err) {
      console.error("Follow error:", err);
      alert("Could not send follow request");
    }
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading profile...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>
          {user.user_id ? user.user_id : "Public Profile"}
        </h2>

        {user.email && (
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        )}

        {user.bio && (
          <p>
            <strong>Bio:</strong> {user.bio}
          </p>
        )}

        <p>
          <strong>Website:</strong>{" "}
          {user.website ? (
            <a href={user.website} target="_blank" rel="noreferrer">
              {user.website}
            </a>
          ) : (
            "N/A"
          )}
        </p>

        {/* Show Follow button if not same user */}
        {currentUser && currentUser._id !== user._id && (
          <div style={{ marginTop: "1rem" }}>
            {followStatus === "accepted" ? (
              <button style={styles.followBtnDisabled}>Following</button>
            ) : followStatus === "pending" ? (
              <button style={styles.followBtnDisabled}>Pending</button>
            ) : (
              <button style={styles.followBtn} onClick={handleFollow}>
                Follow
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f4f7",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 0 12px rgba(0,0,0,0.1)",
    maxWidth: "600px",
    width: "100%",
    fontFamily: "Segoe UI, sans-serif",
  },
  heading: {
    fontSize: "1.6rem",
    marginBottom: "1rem",
    textAlign: "center",
    color: "#333",
  },
  followBtn: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  followBtnDisabled: {
    backgroundColor: "#ccc",
    color: "#555",
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "not-allowed",
  },
};

export default PublicProfile;
