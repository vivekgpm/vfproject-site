import React from 'react';
import { Link } from 'react-router-dom';
import '../components/AppStyles.css';

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Vachana Business Development Executive</h1>
          <p>Your pathway to success</p>
          <Link to="/projects" className="cta-button">Explore Projects</Link>
        </div>
      </section>

      {/* Overview Section */}
      <section className="overview-section">
        <div className="container">
         
          <div className="overview-content">
            <div className="overview-text">
              <h3>Opportunity to grow together</h3>
              <p>Vachana group bringing you "Business Development Associate" concept, which will provide new investment opportunity with unique referral, discount and incentive benefits.</p>
              <Link to="/about" className="learn-more">Learn more</Link>
            </div>
            <div className="overview-image">
              <img src="/images/overview.jpg" alt="Project Overview" />
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      

      {/* Project Types Section */}
      

      {/* Amenities Section */}
      

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2>Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <p>Phone: +91 6363186060</p>
            
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
