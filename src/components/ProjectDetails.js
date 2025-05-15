import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../components/AppStyles.css";

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
  //  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchProjectAndTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        let projectData = null;

        // First try to get project data from location state
        if (location.state?.project) {
          projectData = location.state.project;
        } else {
          // If not in location state, fetch from Firebase
          const projectDoc = await getDoc(doc(db, "projects", id));
          if (!projectDoc.exists()) {
            throw new Error("Project not found in database");
          }
          projectData = { id: projectDoc.id, ...projectDoc.data() };
        }

        if (!projectData) {
          throw new Error("Unable to load project details");
        }

        setProject(projectData);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err.message || "Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectAndTransactions();
    }
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="error-container">
        <p>Project not found</p>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  const renderInventoryFields = () => {
    switch (project.type) {
      case "Residential Plot":
      case "Commercial Plot":
        return (
          <>
            <div className="detail-item">
              <span className="detail-label">Plot Number</span>
              <span className="detail-value">
                {project.plotNumber || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Facing</span>
              <span className="detail-value">{project.facing || "N/A"}</span>
            </div>
          </>
        );
      case "Villa":
        return (
          <>
            <div className="detail-item">
              <span className="detail-label">Villa Number</span>
              <span className="detail-value">
                {project.villaNumber || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Facing</span>
              <span className="detail-value">{project.facing || "N/A"}</span>
            </div>
          </>
        );
      case "Farm Land":
        return (
          <div className="detail-item">
            <span className="detail-label">Survey Number</span>
            <span className="detail-value">
              {project.surveyNumber || "N/A"}
            </span>
          </div>
        );
      case "Commercial Shop":
        return (
          <>
            <div className="detail-item">
              <span className="detail-label">Shop Number</span>
              <span className="detail-value">
                {project.shopNumber || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Floor</span>
              <span className="detail-value">{project.floor || "N/A"}</span>
            </div>
          </>
        );
      case "Apartment":
      case "Hotel Rooms":
        return (
          <>
            <div className="detail-item">
              <span className="detail-label">Unit Number</span>
              <span className="detail-value">
                {project.unitNumber || "N/A"}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Floor</span>
              <span className="detail-value">{project.floor || "N/A"}</span>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const handleBooking = () => {
    navigate(`/book-asset/${project.id}/${project.type}`, {
      state: {
        projectId: project.id,
        name: project.name,
        type: project.type,
        area: project.area,
        location: project.location,
        totalPrice: project.price || 5000000,
        discount: project.discount?.replace("%", "") || "0",
        image: getProjectImage(project.type),
        description: project.description,
        price: project.price
      },
    });
  };

  return (
    <div className="project-details-page">
      <div
        className="project-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${getProjectImage(
            project.type
          )})`,
        }}
      >
        <div className="project-hero-content">
          <h1>{project.name}</h1>
          <p className="project-type">{project.type}</p>
          <p className="project-location">
            <i className="fas fa-map-marker-alt"></i>
            {project.location}
          </p>
        </div>
      </div>

      <div className="container">
        <div className="project-content">
          <div className="project-main">
            <div className="project-info">
              <h2>Project Details</h2>
              <div className="project-description">
                <p>{project.description || "No description available"}</p>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Area</span>
                  <span className="detail-value">{project.area} sq.ft</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Price</span>
                  <span className="detail-value">
                    ₹{project.price ? project.price.toLocaleString() : "0"}
                  </span>
                </div>
                {renderInventoryFields()}
              </div>

              <div className="project-features">
                <h3>Features</h3>
                <ul>
                  {project.features?.map((feature, index) => (
                    <li key={index}>
                      <i className="fas fa-check"></i>
                      {feature}
                    </li>
                  )) || <li>No features listed</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="project-sidebar">
            {project.discount && (
              <div className="discount-banner">
                <h3>Special Offer</h3>
                <p className="discount-badge">
                  {project.discount} Discount Available
                </p>
              </div>
            )}
            <div className="booking-card">
              <button className="book-now-btn" onClick={handleBooking}>
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
