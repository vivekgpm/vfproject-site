import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  

  return (
    <header className="header">
      <div className="header-content">
        <h1>Vachana Franchise</h1>
        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/projects">Projects</Link>
            </li>
            <li>
              <Link to="/plans">Plans</Link>
            </li>
            <li>
              <Link to="/profile">Profile</Link>
            </li>
            <li>
              <Link to="/admin">Admin</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
