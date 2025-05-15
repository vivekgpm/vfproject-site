import React from 'react';
import { Link } from 'react-router-dom';
import '../components/AppStyles.css';

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Your Future, Our Priority</h1>
          <p>Premium plots in a strategically located, well-developed community</p>
          <Link to="/projects" className="cta-button">Explore Projects</Link>
        </div>
      </section>

      {/* Overview Section */}
      <section className="overview-section">
        <div className="container">
          <h2>Overview</h2>
          <div className="overview-content">
            <div className="overview-text">
              <h3>Spaces for Togetherness</h3>
              <p>Life feels better when shared. At this development, every space is thoughtfully designed to nurture connections. From serene gardens to lively common areas, it encourages a harmonious blend of personal and community living.</p>
              <Link to="/about" className="learn-more">Learn more</Link>
            </div>
            <div className="overview-image">
              <img src="/images/overview.jpg" alt="Project Overview" />
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌳</div>
              <h3>47% Open Space</h3>
              <p>Ample green spaces for a healthy lifestyle</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌿</div>
              <h3>4 Acres of Green Cover</h3>
              <p>Lush greenery throughout the project</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏞️</div>
              <h3>1-Acre Regenerative Park</h3>
              <p>Dedicated space for recreation</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌲</div>
              <h3>5000+ Trees</h3>
              <p>Rich biodiversity within the project</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Types Section */}
      <section className="project-types-section">
        <div className="container">
          <h2>Project Configuration</h2>
          <div className="project-types-grid">
            <div className="project-type-card">
              <h3>Residential Plots</h3>
              <ul>
                <li>30 x 40 - 1200 sq.ft</li>
                <li>30 x 50 - 1500 sq.ft</li>
              </ul>
              <Link to="/projects" className="view-more">View Details</Link>
            </div>
            <div className="project-type-card">
              <h3>Commercial Sites</h3>
              <ul>
                <li>Various sizes available</li>
                <li>Prime locations</li>
              </ul>
              <Link to="/projects" className="view-more">View Details</Link>
            </div>
            <div className="project-type-card">
              <h3>Senior Citizen Villas</h3>
              <ul>
                <li>Spacious layouts</li>
                <li>Easy accessibility</li>
              </ul>
              <Link to="/projects" className="view-more">View Details</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="amenities-section">
        <div className="container">
          <h2>Amenities</h2>
          <div className="amenities-grid">
            <div className="amenity-item">
              <div className="amenity-icon">🏊‍♂️</div>
              <h4>Swimming Pool</h4>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">🎾</div>
              <h4>Sports Facilities</h4>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">🌳</div>
              <h4>Green Spaces</h4>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">🏋️‍♂️</div>
              <h4>Fitness Center</h4>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">🎯</div>
              <h4>Club House</h4>
            </div>
            <div className="amenity-item">
              <div className="amenity-icon">🚶‍♂️</div>
              <h4>Walking Trails</h4>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2>Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>Phone: +91 6363186060</p>
              <p>Email: info@example.com</p>
              <p>Address: Basavakalyan - Dist. Bidar</p>
            </div>
            <div className="contact-form">
              <form>
                <input type="text" placeholder="Your Name" />
                <input type="email" placeholder="Your Email" />
                <textarea placeholder="Your Message"></textarea>
                <button type="submit" className="submit-button">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
