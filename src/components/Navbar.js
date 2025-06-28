import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../components/AppStyles.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/logo.jpg" alt="Vachana Business Development Executive" />
        </Link>
        {/* Debugging: Display user state */}
        {/* <div>User: {user ? JSON.stringify(user) : 'Not logged in'}</div> */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenu}>Home</Link>
          <Link to="/projects" className="nav-link" onClick={closeMenu}>Projects</Link>
          
          <Link to="/contact" className="nav-link" onClick={closeMenu}>Contact</Link>
          <Link to="/plans" className="nav-link" onClick={closeMenu}>Plans</Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className="nav-link" onClick={closeMenu}>Admin</Link>
                  <Link to="/admin/inventory" className="nav-link" onClick={closeMenu}>Inventory</Link>
                </>
              )}
              {user.role === 'user' && (
                <Link to="/profile" className="nav-link" onClick={closeMenu}>Profile</Link>
              )}
              <button onClick={handleLogout} className="nav-button">Logout</button>
            </>
          ) : (
            <Link to="/login" className="nav-button" onClick={closeMenu}>Login</Link>
          )}
        </div>

        <button 
          className={`hamburger ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
