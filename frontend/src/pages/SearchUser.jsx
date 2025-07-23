import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./SearchUser.css";

const SearchUser = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searched, setSearched] = useState(false); // 👈 New state to track if search has happened
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSearch = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/search?query=${query}`);
      setResults(res.data);
      setSearched(true); // 👈 Mark search as completed
    } catch (err) {
      console.error("Search failed:", err);
      setSearched(true);
      setResults([]); // 👈 Clear results on error
    }
  };

  return (
    <div className="search-wrapper">
      {currentUser && (
        <div
          className="corner-avatar"
          onClick={() => navigate("/profile")}
          title="Go to your profile"
        >
          <span className="corner-initial">
            {currentUser.user_id?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
      )}

      <h2>Search Users</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {searched && results.length === 0 && (
        <p style={{ marginTop: "1rem", color: "#ff8080" }}>
          No users found.
        </p>
      )}

      <ul className="search-results-list">
        {results.map((user) => (
          <li
            key={user._id}
            className="search-user-card"
            onClick={() => navigate(`/profile/${user._id}`)}
          >
            <img
              src={
                user.profileImage?.trim()
                  ? user.profileImage
                  : "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.user_id)
              }
              alt="avatar"
              className="search-avatar"
            />
            <span className="search-user-id">{user.user_id}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchUser;

