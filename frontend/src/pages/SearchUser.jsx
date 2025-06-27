import React, { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./SearchUser.css";

const SearchUser = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/users/search?query=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  return (
    <div className="search-wrapper">
      <h2>Search Users</h2>
      <input
        type="text"
        placeholder="Enter username"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      <ul>
        {results.map((user) => (
          <li
            key={user._id}
            onClick={() => navigate(`/profile/${user._id}`)}
            style={{ cursor: "pointer" }}
          >
            {user.user_id} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchUser;

