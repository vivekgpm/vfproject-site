import React, { useState, useEffect, useRef } from 'react';
import { searchUsersByName } from '../api/userApi';
import './AppStyles.css';

const UserSearchSelect = ({ onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = async (value) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchUsersByName(value);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      searchUsers(value);
    }, 300); // Debounce for 300ms
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.displayName);
    setShowSuggestions(false);
    onUserSelect(user);
  };

  const handleFocus = () => {
    if (searchTerm) {
      searchUsers(searchTerm);
    }
  };

  return (
    <div className="user-search-section" ref={wrapperRef}>
      <h3>Search Member</h3>
      <div className="search-select-container">
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder="Type to search users..."
          autoComplete="off"
        />
        {isLoading && <div className="loading-indicator">Loading...</div>}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="suggestions-list">
            {suggestions.map((user) => (
              <li
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="suggestion-item"
              >
                <div className="user-suggestion">
                  <span className="user-name">{user.displayName}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {showSuggestions && !isLoading && suggestions.length === 0 && (
          <div className="no-results">No users found</div>
        )}
      </div>
      {selectedUser && (
        <div className="selected-user-info">
          <p>Selected: {selectedUser.displayName}</p>
          <p>Referral ID: {selectedUser.bdaId || "N/A"}</p>
        </div>
      )}
    </div>
  );
};

export default UserSearchSelect;
