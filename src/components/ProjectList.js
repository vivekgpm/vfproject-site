import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/AppStyles.css"; // Import your CSS styles

// Import images
import villa from "../assets/images/villa.jpg";
import resPlot from "../assets/images/resPlot.jpg";
import comPlot from "../assets/images/comPlot.jpg";
import cc from "../assets/images/img100.jpg";
import defaultImage from "../assets/images/default-project.png";

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
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
    const fetchProjects = async () => {
      try {
        const projectsCollection = collection(db, "projects");
        const projectsSnapshot = await getDocs(projectsCollection);
        const projectsList = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsList);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch projects");
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

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
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-hero">
        <h1>Our Projects</h1>
        <p>Discover our investment opportunities</p>
      </div>

      <div className="container">
        <div className="projects-grid">
          {projects.map((project) => (
            <Link
              to={`/projects/${project.id}`}
              key={project.id}
              className="project-card"
              state={{ project: project }}
            >
              <div className="project-image">
                <img
                  src={project.imageUrl || getProjectImage(project.type)}
                  alt={project.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultImage;
                  }}
                />
              </div>
              <div className="project-name">
                <h3>{project.name}</h3>
              </div>
              <div className="project-name">
                <h4>{project.type}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectList;
