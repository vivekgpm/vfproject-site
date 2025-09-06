import { useState, useEffect } from "react";
import {
  ChevronLeft, // Added for slider
  ChevronRight,
  Users,
  TrendingUp,
  Phone,
  MapPin,
  Building,
  Star,
  ArrowRight,
} from "lucide-react";
import img1 from "../assets/images/img68.jpg";
import img2 from "../assets/images/img91.jpg";
import img3 from "../assets/images/img100.jpg";
import img4 from "../assets/images/overview.jpg";
import "../styles/Home.css"; // Import your CSS styles
import "./Home.css"; // Import your CSS styles
// Example image, replace with actual images

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // For image slider

  const sliderImages = [
    img1,
    img2,
    img3,
    img4, // Add more images as needed
  ];

  useEffect(() => {
    setIsVisible(true);
    // Optional: Auto-slide images
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % sliderImages.length
      );
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % sliderImages.length);
  };

  const goToPrevImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + sliderImages.length) % sliderImages.length
    );
  };

  const features = [
    {
      icon: <Building className="feature-icon-svg" />,
      title: "Premium Projects",
      description:
        "Carefully curated real estate opportunities with guaranteed returns",
    },
    {
      icon: <Users className="feature-icon-svg" />,
      title: "Expert Guidance",
      description:
        "Professional consultation from experienced business development executives",
    },
    {
      icon: <TrendingUp className="feature-icon-svg" />,
      title: "Growth Opportunities",
      description:
        "Unique referral system with attractive incentives and discount benefits",
    },
  ];

  const stats = [
    { number: "3000+", label: "Happy Clients" },
    { number: "10+", label: "Projects Completed" },
    { number: "15+", label: "Years Experience" },
    { number: "100%", label: "Client Satisfaction" },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 3000); // Hide message after 3 seconds
  };

  return (
    <>
      <style>
        {`
        /* Import Google Font - Inter */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap');

       
        `}
      </style>
      {/* Main container */}
      <div className="homepage-wrapper">
        {/* Hero Section */}
        <section id="hero-section" className="hero-section">
          {/* Animated Background Elements */}
          <div className="hero-bg-element-1"></div>
          <div className="hero-bg-element-2"></div>
          <div className="hero-bg-element-3"></div>

          <div
            className={`container text-center relative z-10 ${
              isVisible ? "slide-in visible" : "slide-in"
            }`}
          >
            <h1 className="hero-headline">
              <span className="hero-headline-primary">Vachana</span>
              <br />
              <span className="hero-subheadline-secondary">
                Business Development Associate
              </span>
            </h1>

            <p className="hero-subheadline-text">
              Your gateway to investments and sustainable growth opportunities
            </p>

            <div className="hero-button-group">
              <button className="btn-primary group-hover-translate-x-1">
                Explore Projects
                <ArrowRight
                  className="arrow-icon"
                  style={{ width: "1.25rem", height: "1.25rem" }}
                />
              </button>
            </div>

            {/* Stats Section */}
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item hover-scale-105">
                  <div className="stat-number">{stat.number}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="scroll-indicator">
            <ChevronRight style={{ width: "1.5rem", height: "1.5rem" }} />
          </div>
        </section>

        {/* About/Overview Section */}
        <section className="about-section">
          <div className="container relative z-10">
            <div className="about-grid">
              {/* Image Slider Container */}
              <div className="image-slider-container">
                <img
                  src={sliderImages[currentImageIndex]}
                  alt={`Modern Building ${currentImageIndex + 1}`}
                  className="image-slider-image"
                />
                <button
                  className="slider-control-button slider-control-prev"
                  onClick={goToPrevImage}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={30} />
                </button>
                <button
                  className="slider-control-button slider-control-next"
                  onClick={goToNextImage}
                  aria-label="Next image"
                >
                  <ChevronRight size={30} />
                </button>
              </div>

              <div>
                <div className="about-tag">
                  <Star style={{ width: "1rem", height: "1rem" }} />
                  Premium Opportunity
                </div>

                <h2 className="about-heading">
                  Opportunity to
                  <span className="about-heading-accent"> Grow Together</span>
                </h2>

                <p className="about-text">
                  Vachana Group presents the innovative{" "}
                  <strong style={{ color: "var(--color-teal)" }}>
                    "Business Development Associate"
                  </strong>{" "}
                  concept, offering you exclusive investment opportunities with
                  unique referral programs, attractive discounts, and lucrative
                  incentive benefits.
                </p>

                <div className="about-list">
                  <div className="about-list-item">
                    <div className="about-list-icon-bg">
                      <ChevronRight style={{ width: "1rem", height: "1rem" }} />
                    </div>
                    <span className="about-list-text">
                      Exclusive Investment Opportunities
                    </span>
                  </div>
                  <div className="about-list-item">
                    <div className="about-list-icon-bg">
                      <ChevronRight style={{ width: "1rem", height: "1rem" }} />
                    </div>
                    <span className="about-list-text">
                      Attractive Referral Benefits
                    </span>
                  </div>
                  <div className="about-list-item">
                    <div className="about-list-icon-bg">
                      <ChevronRight style={{ width: "1rem", height: "1rem" }} />
                    </div>
                    <span className="about-list-text">
                      Professional Growth Support
                    </span>
                  </div>
                </div>

                <button className="about-button">
                  Learn More About Us
                  <ArrowRight
                    className="arrow-icon"
                    style={{ width: "1.25rem", height: "1.25rem" }}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Section (Featured Properties/Services) */}
        <section id="features-section" className="features-section">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="section-title">
                Why Choose
                <span className="section-title-accent"> Vachana Group?</span>
              </h2>
              <p className="section-subtitle">
                We provide comprehensive opportunities for your investment
                journey
              </p>
            </div>

            <div className="features-grid">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="feature-card hover-translate-y-neg-2 group-hover-scale-110"
                >
                  <div className="feature-icon-container">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact-section" className="contact-section">
          {/* Decorative background elements */}
          <div className="contact-bg-element-1"></div>
          <div className="contact-bg-element-2"></div>

          <div className="container relative z-10">
            <div className="text-center mb-16">
              <h2
                className="section-title"
                style={{ color: "var(--color-white)" }}
              >
                Ready to Start Your
                <span style={{ color: "var(--color-light-beige)" }}>
                  {" "}
                  Journey?
                </span>
              </h2>
              <p
                className="section-subtitle"
                style={{ opacity: 0.9, color: "var(--color-white)" }}
              >
                Connect with our experts and discover exclusive investment
                opportunities
              </p>
            </div>

            <div className="contact-grid">
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h3 className="contact-info-heading">Get in Touch</h3>

                  <div className="space-y-6">
                    <div className="contact-info-item">
                      <div className="contact-info-icon-bg">
                        <Phone style={{ width: "1.5rem", height: "1.5rem" }} />
                      </div>
                      <div>
                        <p className="contact-info-label">Phone</p>
                        <p className="contact-info-text">+91 6363186060</p>
                      </div>
                    </div>

                    <div className="contact-info-item">
                      <div className="contact-info-icon-bg">
                        <MapPin style={{ width: "1.5rem", height: "1.5rem" }} />
                      </div>
                      <div>
                        <p className="contact-info-label">Address</p>
                        <p className="contact-info-text">
                          Basavakalyan - Dist. Bidar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="contact-form-card">
                <div className="space-y-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <textarea
                      rows="4"
                      placeholder="Your Message"
                      className="form-textarea resize-none"
                    ></textarea>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    className="contact-send-button"
                  >
                    Send Message
                  </button>
                  {showMessage && (
                    <div className="success-message">
                      Thank you for your message! We will contact you soon.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div id="admin-section"></div> {/* Placeholder for Admin section link */}
    </>
  );
};

export default HomePage;
