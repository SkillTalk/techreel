import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./SearchUser.css";

const SearchUser = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterBy, setFilterBy] = useState("all"); // all, skills, profession
  const [isRestoredFromCache, setIsRestoredFromCache] = useState(false);
  const [displayedResults, setDisplayedResults] = useState([]);
  const [showAllResults, setShowAllResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }

    // Load last search results from localStorage
    const lastSearchQuery = localStorage.getItem("lastSearchQuery");
    const lastSearchResults = localStorage.getItem("lastSearchResults");
    
    if (lastSearchQuery && lastSearchResults) {
      const restoredResults = JSON.parse(lastSearchResults);
      setQuery(lastSearchQuery);
      setResults(restoredResults);
      setSearched(true);
      setIsRestoredFromCache(true);
      
      // Apply mobile limit to restored results
      const isMobile = window.innerWidth <= 768;
      const maxResults = isMobile ? 10 : restoredResults.length;
      setDisplayedResults(restoredResults.slice(0, maxResults));
      setShowAllResults(restoredResults.length <= maxResults);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/users/search?query=${query}`);
      setResults(res.data);
      setSearched(true);
      
      // Limit results on mobile to prevent overflow
      const isMobile = window.innerWidth <= 768;
      const maxResults = isMobile ? 10 : res.data.length;
      setDisplayedResults(res.data.slice(0, maxResults));
      setShowAllResults(res.data.length <= maxResults);
      
      // Save search results to localStorage for persistence
      localStorage.setItem("lastSearchQuery", query.trim());
      localStorage.setItem("lastSearchResults", JSON.stringify(res.data));
      setIsRestoredFromCache(false);
      
      // Add to recent searches
      const newSearch = {
        query: query.trim(),
        timestamp: Date.now(),
        resultCount: res.data.length
      };
      
      const updatedSearches = [newSearch, ...recentSearches.filter(s => s.query !== query.trim())].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    } catch (err) {
      console.error("Search failed:", err);
      setSearched(true);
      setResults([]);
      // Clear saved search on error
      localStorage.removeItem("lastSearchQuery");
      localStorage.removeItem("lastSearchResults");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setIsRestoredFromCache(false);
    // Clear saved search from localStorage
    localStorage.removeItem("lastSearchQuery");
    localStorage.removeItem("lastSearchResults");
  };

  const deleteRecentSearch = (indexToDelete) => {
    const updatedSearches = recentSearches.filter((_, index) => index !== indexToDelete);
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const showMoreResults = () => {
    const isMobile = window.innerWidth <= 768;
    const maxResults = isMobile ? 20 : results.length;
    setDisplayedResults(results.slice(0, maxResults));
    setShowAllResults(maxResults >= results.length);
  };

  const handleUserClick = (user) => {
    navigate(`/profile/${user._id}`);
  };

  const filteredResults = displayedResults.filter(user => {
    if (filterBy === "all") return true;
    if (filterBy === "skills" && user.skills && user.skills.length > 0) return true;
    if (filterBy === "profession" && user.profession) return true;
    return false;
  });

  return (
    <div className="search-container">
      {/* Header */}
      <div className="search-header">
        <div className="search-header-content">
          <button 
            className="back-btn"
            onClick={() => navigate("/profile")}
          >
            ←
          </button>
          <h1 className="search-title">Discover People</h1>
          <div className="header-actions">
            <button 
              className="filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍
            </button>
            {currentUser && (
              <div 
                className="profile-avatar"
                onClick={() => navigate("/profile")}
              >
                <img
                  src={
                    currentUser.profileImage?.trim()
                      ? currentUser.profileImage
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.user_id)}&background=6366f1&color=fff`
                  }
                  alt="Profile"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-input-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by username, skills, or profession..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
            {query && (
              <button className="clear-btn" onClick={clearSearch}>
                ✕
              </button>
            )}
          </div>
          <button 
            className="search-btn"
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? "..." : "Search"}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="filters-container">
            <div className="filter-options">
              <button 
                className={`filter-option ${filterBy === "all" ? "active" : ""}`}
                onClick={() => setFilterBy("all")}
              >
                All Users
              </button>
              <button 
                className={`filter-option ${filterBy === "skills" ? "active" : ""}`}
                onClick={() => setFilterBy("skills")}
              >
                With Skills
              </button>
              <button 
                className={`filter-option ${filterBy === "profession" ? "active" : ""}`}
                onClick={() => setFilterBy("profession")}
              >
                With Profession
              </button>
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!searched && recentSearches.length > 0 && (
          <div className="recent-searches">
            <div className="recent-searches-header">
              <h3>Recent Searches</h3>
              <button 
                className="clear-all-btn"
                onClick={clearAllRecentSearches}
                title="Clear all recent searches"
              >
                Clear All
              </button>
            </div>
            <div className="recent-search-items">
              {recentSearches.map((search, index) => (
                <div 
                  key={index}
                  className="recent-search-item"
                >
                  <div 
                    className="recent-search-content"
                    onClick={() => {
                      setQuery(search.query);
                      handleSearch();
                    }}
                  >
                    <span className="recent-icon">🕒</span>
                    <span className="recent-query">{search.query}</span>
                    <span className="recent-count">{search.resultCount} results</span>
                  </div>
                  <button 
                    className="delete-search-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecentSearch(index);
                    }}
                    title="Delete this search"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {searched && (
        <div className="results-section">
          <div className="results-header">
            <h2>
              {filteredResults.length} {filteredResults.length === 1 ? "person" : "people"} found
              {query && ` for "${query}"`}
              {!showAllResults && results.length > displayedResults.length && (
                <span className="results-count-info">
                  {" "}(showing {displayedResults.length} of {results.length})
                </span>
              )}
            </h2>
            <div className="results-header-actions">
              {isRestoredFromCache && (
                <span className="cache-indicator">
                  📱 Restored from cache
                </span>
              )}
              {filterBy !== "all" && (
                <span className="filter-indicator">
                  Filtered by: {filterBy}
                </span>
              )}
              <button 
                className="refresh-search-btn"
                onClick={handleSearch}
                title="Refresh search results"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">👥</div>
              <h3>No people found</h3>
              <p>Try searching with different keywords or check your spelling.</p>
              <button className="try-again-btn" onClick={clearSearch}>
                Try Again
              </button>
            </div>
          ) : (
            <div className="users-grid">
              {filteredResults.map((user) => (
                <div
                  key={user._id}
                  className="user-card"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-card-header">
                    <div className="user-avatar">
                      <img
                        src={
                          user.profileImage?.trim()
                            ? user.profileImage
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_id)}&background=6366f1&color=fff`
                        }
                        alt={user.user_id}
                      />
                      <div className="online-indicator"></div>
                    </div>
                    <div className="user-info">
                      <h3 className="username">@{user.user_id}</h3>
                      {user.profession && (
                        <p className="profession">{user.profession}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="user-details">
                    {user.bio && (
                      <p className="user-bio">{user.bio}</p>
                    )}
                    
                    {user.skills && user.skills.length > 0 && (
                      <div className="skills-section">
                        <span className="skills-label">Skills:</span>
                        <div className="skills-tags">
                          {user.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="more-skills">+{user.skills.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="user-stats">
                      <div className="stat">
                        <span className="stat-number">{user.followers?.length || 0}</span>
                        <span className="stat-label">Followers</span>
                      </div>
                      <div className="stat">
                        <span className="stat-number">{user.following?.length || 0}</span>
                        <span className="stat-label">Following</span>
                      </div>
                      {user.experienceYears && (
                        <div className="stat">
                          <span className="stat-number">{user.experienceYears}</span>
                          <span className="stat-label">Years Exp</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    <button className="view-profile-btn">
                      View Profile →
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Show More Button */}
              {!showAllResults && results.length > displayedResults.length && (
                <div className="show-more-section">
                  <button 
                    className="show-more-btn"
                    onClick={showMoreResults}
                  >
                    Show More Results ({results.length - displayedResults.length} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchUser;

