import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
//import '../styles/AppStyles.css';
import "./ProjectDetails.css"; // Import your CSS styles
import { getProjectById, getLocationById } from "../api/projectApi";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Users,
  ChevronLeft,
  Building,
  MapIcon,
  TreePine,
  Car,
} from "lucide-react";
import { FaChild, FaRoad } from "react-icons/fa";
import { MdOutlineElectricBolt } from "react-icons/md";
import { GiWaterDrop } from "react-icons/gi";
import { MdWater } from "react-icons/md";

// Import images
import villa from "../assets/images/villa.jpg";
import resPlot from "../assets/images/resPlot.jpg";
import comPlot from "../assets/images/comPlot.jpg";
import defaultImage from "../assets/images/default-project.png";
import cc from "../assets/images/img100.jpg";

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  // Plot size filter state
  const [selectedSize, setSelectedSize] = useState("All");
  // Plot status filter state
  const [selectedStatus, setSelectedStatus] = useState("All");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Function to get image based on project type
  const getProjectImage = (type) => {
    switch (type) {
      case "Villa":
        return villa;
      case "Residential Plot":
        return resPlot;
      case "Commercial Plot":
        return comPlot;
      case "ConventionCenter":
        return cc;
      default:
        return defaultImage;
    }
  };

  // Function to get amenity icon
  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case "garden":
        return <TreePine className="w-5 h-5" />;
      case "playground":
        return <Users className="w-5 h-5" />;
      case "parking":
        return <Car className="w-5 h-5" />;
      case "temple":
        return <Building className="w-5 h-5" />;
      case "community_hall":
        return <Home className="w-5 h-5" />;
      case "Open drainage":
        return <MdWater className="w-5 h-5" />;
      case "Water Connection":
        return <GiWaterDrop className="w-5 h-5" />;
      case "Electricity Connection":
        return <MdOutlineElectricBolt className="w-5 h-5" />;
      case "Children's play area":
        return <FaChild className="w-5 h-5" />;
      case "9mtr road":
        return <FaRoad className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  // Book Now click handler
  const handleBookNow = () => {
    navigate(`/book-asset/${project.id}/${project.type}`, {
      state: {
        project,
        initialTab: 0, // 0 represents the User Details tab},
      },
    });
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        let projectData = null;

        // First try to get project data from location state
        if (location.state?.project) {
          projectData = location.state.project;
        } else {
          // If not in location state, fetch from API
          projectData = await getProjectById(id);
        }

        if (!projectData) {
          throw new Error("Unable to load project details");
        }

        setProject(projectData);

        // Fetch location details if locationId is available
        if (projectData.locationId) {
          try {
            const locationDetails = await getLocationById(
              projectData.locationId
            );
            setLocationData(locationDetails);
          } catch (locationError) {
            console.warn("Could not fetch location details:", locationError);
          }
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err.message || "Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectDetails();
    }
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/projects" className="btn btn-error">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4">
          <div className="text-gray-400 text-6xl mb-4 text-center">🏘️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            Project Not Found
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            The requested project could not be found.
          </p>
          <Link
            to="/projects"
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="project-details-container">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header with Back Button */}
        <div className="project-header">
          <div className="container">
            <button
              onClick={() => navigate("/projects")}
              className="back-button"
            >
              ← Back to Projects
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div
          className="hero-section"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${
              project.imageUrl || getProjectImage(project.type)
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="hero-content">
            <div className="container">
              <div className="project-badges">
                <span className="badge badge-type">{project.type}</span>
              </div>
              <h1 className="project-title">{project.name}</h1>
              {locationData && (
                <div className="location-info">
                  📍 {locationData.city}, {locationData.state}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container main-content">
          <div className="content-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Tab Navigation */}
              <div className="tabs-container">
                <div className="tab-nav">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "location", label: "Location" },
                    { id: "amenities", label: "Amenities" },
                    { id: "plots", label: "Plot Details" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-button ${
                        activeTab === tab.id ? "active" : ""
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                  {activeTab === "overview" && (
                    <div className="description">
                      <p>
                        {project.description ||
                          "Premium residential development offering modern amenities and excellent connectivity."}
                      </p>
                      <div>
                        <br></br>
                      </div>
                      <div className="stats-grid">
                        <div className="stat-card total">
                          <div className="stat-number">
                            {project.totalPlots}
                          </div>
                          <div className="stat-label">Total Plots</div>
                        </div>
                        <div className="stat-card available">
                          <div className="stat-number">
                            {project.availablePlots}
                          </div>
                          <div className="stat-label">Available</div>
                        </div>
                        <div className="stat-card booked">
                          <div className="stat-number">
                            {project.soldPlots}
                          </div>
                          <div className="stat-label">Sold</div>
                        </div>
                        <div className="stat-card reserved">
                          <div className="stat-number">
                            {project.reservedPlots || 0}
                          </div>
                          <div className="stat-label">Reserved</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "location" && (
                    <div className="location-content">
                      <h3>Location Details</h3>
                      {locationData ? (
                        <div className="location-details">
                          <div className="location-card">
                            <h4>{locationData.name}</h4>
                            <p>{locationData.address}</p>
                            <p className="district-info">
                              {locationData.district &&
                                `${locationData.district} District, `}
                              {locationData.state}
                            </p>
                            {locationData.coordinates && (
                              <a
                                href={`https://www.google.com/maps?q=${locationData.coordinates.lat},${locationData.coordinates.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="map-link"
                              >
                                <MapIcon className="w-5 h-5" />
                                <span>View on Google Maps</span>
                              </a>
                            )}
                          </div>

                          {locationData.coordinates && (
                            <div className="coordinates-card">
                              <h4>Coordinates</h4>
                              <p>
                                {locationData.coordinates.lat}°N,{" "}
                                {locationData.coordinates.lng}°E
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>Location details not available</p>
                      )}
                    </div>
                  )}
                  {/* Other tab contents... */}
                  {activeTab === "amenities" && (
                    <div className="amenities-content">
                      <h3>Project Amenities</h3>
                      {project.amenities && project.amenities.length > 0 ? (
                        <div className="amenities-grid">
                          {project.amenities.map((amenity) => (
                            <div key={amenity} className="amenity-card">
                              <div className="amenity-icon">
                                {getAmenityIcon(amenity)}
                              </div>
                              <span className="amenity-name">
                                {amenity
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No amenities information available</p>
                      )}
                    </div>
                  )}

                  {activeTab === "plots" && (
                    <div className="plots-content">
                      <div className="plots-header">
                        <h3>Plot Details & Inventory</h3>
                        <div className="plot-summary">
                          <div className="summary-item">
                            <span className="summary-number total">
                              {project.totalPlots}
                            </span>
                            <span className="summary-label">Total Plots</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-number available">
                              {project.availablePlots}
                            </span>
                            <span className="summary-label">Available</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-number booked">
                              {project.bookedPlots}
                            </span>
                            <span className="summary-label">Booked</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-number reserved">
                              {project.reservedPlots || 0}
                            </span>
                            <span className="summary-label">Reserved</span>
                          </div>
                        </div>
                      </div>

                      {/* Plot Size Filter */}
                      <div className="plot-filters">
                        <h4>Filter by Plot Size:</h4>
                        <div className="size-filters">
                          <button
                            className={`filter-btn ${
                              selectedSize === "All" ? "active" : ""
                            }`}
                            onClick={() => setSelectedSize("All")}
                          >
                            All Sizes
                          </button>
                          {project.plotSizes?.map((size, index) => (
                            <button
                              key={index}
                              className={`filter-btn ${
                                selectedSize === size ? "active" : ""
                              }`}
                              onClick={() => setSelectedSize(size)}
                            >
                              {size} sq.ft
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Plot Status Filter */}
                      <div className="plot-filters">
                        <h4>Filter by Status:</h4>
                        <div className="status-filters">
                          <button
                            className={`filter-btn ${
                              selectedStatus === "All" ? "active" : ""
                            }`}
                            onClick={() => setSelectedStatus("All")}
                          >
                            All
                          </button>
                          <button
                            className={`filter-btn ${
                              selectedStatus === "available" ? "active" : ""
                            }`}
                            onClick={() => setSelectedStatus("available")}
                          >
                            Available
                          </button>
                          <button
                            className={`filter-btn ${
                              selectedStatus === "booked" ? "active" : ""
                            }`}
                            onClick={() => setSelectedStatus("booked")}
                          >
                            Booked
                          </button>
                          <button
                            className={`filter-btn ${
                              selectedStatus === "reserved" ? "active" : ""
                            }`}
                            onClick={() => setSelectedStatus("reserved")}
                          >
                            Reserved
                          </button>
                        </div>
                      </div>

                      {/* Inventory Grid */}
                      <div className="inventory-section">
                        <div className="inventory-header">
                          <h4>Available Plots</h4>
                          <div className="legend">
                            <div className="legend-item">
                              <div className="legend-color available"></div>
                              <span>Available</span>
                            </div>
                            <div className="legend-item">
                              <div className="legend-color booked"></div>
                              <span>Booked</span>
                            </div>
                            <div className="legend-item">
                              <div className="legend-color reserved"></div>
                              <span>Reserved</span>
                            </div>
                          </div>
                        </div>

                        {/* Plot Grid */}
                        <div className="plot-grid">
                          {Array.from(
                            { length: project.totalPlots },
                            (_, index) => {
                              const plotNumber = `A-${(index + 1)
                                .toString()
                                .padStart(3, "0")}`;
                              const status =
                                index < project.bookedPlots
                                  ? "booked"
                                  : index <
                                    project.bookedPlots +
                                      (project.reservedPlots || 0)
                                  ? "reserved"
                                  : "available";
                              const size =
                                project.plotSizes?.[
                                  index % (project.plotSizes?.length || 1)
                                ] || "30x40";
                              const price = project.priceRange
                                ? project.priceRange.min +
                                  Math.random() *
                                    (project.priceRange.max -
                                      project.priceRange.min)
                                : 500000;

                              // Filter logic
                              if (
                                (selectedSize !== "All" &&
                                  size !== selectedSize) ||
                                (selectedStatus !== "All" &&
                                  status !== selectedStatus)
                              )
                                return null;

                              return (
                                <div
                                  key={index}
                                  className={`plot-card ${status}`}
                                  data-plot={plotNumber}
                                >
                                  <div className="plot-header">
                                    <span className="plot-number">
                                      {plotNumber}
                                    </span>
                                    {/* Removed plot-status from here to put it inside plot-details */}
                                  </div>
                                  <div className="plot-details">
                                    <div className="plot-size">{size} ft</div>
                                    {/* Removed plot-area display */}
                                    <div className="plot-price">
                                      ₹{(price / 100000).toFixed(1)}L
                                    </div>
                                    <span className={`plot-status ${status}`}>
                                      {status.charAt(0).toUpperCase() +
                                        status.slice(1)}
                                    </span>
                                  </div>
                                  {status === "available" && (
                                    <button className="select-plot-btn">
                                      Select Plot
                                    </button>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Price Range Section */}
                      {project.price && (
                        <div className="price-range-section">
                          <h4>Price Range Information</h4>
                          <div className="price-range-grid">
                            <div className="price-card min">
                              <div className="price-label">Starting Price</div>
                              <div className="price-value">
                                ₹{((project.price * 1200) / 100000).toFixed(1)}L
                              </div>
                              <div className="price-sqft">
                                ₹{Math.round(project.price)}
                                /sq.ft
                              </div>
                            </div>
                            <div className="price-card max">
                              <div className="price-label">Maximum Price</div>
                              <div className="price-value">
                                ₹{((project.price * 2400) / 100000).toFixed(1)}L
                              </div>
                              <div className="price-sqft">
                                ₹{Math.round(project.price)}
                                /sq.ft
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="right-column">
              <div className="booking-card">
                <h3>Book This Project</h3>

                {project.priceRange && (
                  <div className="price-section">
                    <div className="price-label">Starting from</div>
                    <div className="price-amount">
                      ₹{((project.price * 1200) / 100000).toFixed(1)}L
                    </div>
                  </div>
                )}

                <div className="booking-stats">
                  <div className="stat-row">
                    <span>Total Plots</span>
                    <span>{project.totalPlots}</span>
                  </div>
                  <div className="stat-row">
                    <span>Available</span>
                    <span className="available-count">
                      {project.availablePlots}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>Occupancy</span>
                    <span>
                      {Math.round(
                        (project.soldPlots / project.totalPlots) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>

                <div className="booking-actions">
                  <button className="btn btn-primary btn-full">
                    View Plot Layout
                  </button>
                  {isAdmin && (
                    <button
                      className="btn btn-success btn-full"
                      onClick={handleBookNow}
                    >
                      Book Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
