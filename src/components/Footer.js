import React from 'react';
import { Link } from 'react-router-dom';
import '../components/AppStyles.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>Vachana Ventures Pvt Ltd offers a unique opportunity for investors looking for premium plots in a strategically located, well-developed community.</p>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/projects">Projects</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Project Highlights</h3>
            <ul>
              <li><Link to="/projects">Residential Plots</Link></li>
              <li><Link to="/projects">Commercial Sites</Link></li>
              <li><Link to="/projects">Senior Citizen Villas</Link></li>
              <li><Link to="/projects">Farm Land</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact Info</h3>
            <ul className="contact-info">
              <li>
                <i className="fas fa-phone"></i>
                <span>+91 6363186060</span>
              </li>
              <li>
                <i className="fas fa-envelope"></i>
                <span>info@example.com</span>
              </li>
              <li>
                <i className="fas fa-map-marker-alt"></i>
                <span>Basavakalyan - Dist. Bidar</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Vachana Ventures Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;