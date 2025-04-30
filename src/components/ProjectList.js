import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../data';

const ProjectList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 8;

  // Get current projects
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="projects-container">
      <h2 className="projects-title">Our Projects</h2>
      <div className="projects-grid">
        {currentProjects.map((project) => (
          <Link 
            to={`/projects/${project.id}`} 
            key={project.id}
            className="project-link"
          >
            <div 
              className="project-card" 
              data-name={project.name}
            >
              <div className="project-image-container">
                <img
                  src={project.image || "https://via.placeholder.com/100x100"}
                  alt={project.name}
                  className="project-main-image"
                />
              </div>
              <div className="project-name-container">
                <span className="project-name">{project.name}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(projects.length / projectsPerPage) }).map((_, index) => (
          <button
            key={index + 1}
            onClick={() => paginate(index + 1)}
            className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProjectList;