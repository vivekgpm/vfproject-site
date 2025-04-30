import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projects } from '../data';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === parseInt(id));

  if (!project) {
    return (
      <div className="not-found">
        <h2>Project not found</h2>
        <Link to="/projects" className="btn btn-primary">Back to Projects</Link>
      </div>
    );
  }

  const renderInventoryFields = () => {
    switch (project.type) {
      case 'Residential Plot':
      case 'Commercial Plot':
      case 'Villa':
        return (
          <>
            <div className="info-item">
              <span className="label">Plot Number</span>
              <span className="value">{project.plotNumber || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Direction</span>
              <span className="value">{project.direction || 'N/A'}</span>
            </div>
          </>
        );
      case 'Farm Land':
        return (
          <div className="info-item">
            <span className="label">Survey Number</span>
            <span className="value">{project.surveyNumber || 'N/A'}</span>
          </div>
        );
      case 'Commercial Shop':
        return (
          <>
            <div className="info-item">
              <span className="label">Shop Number</span>
              <span className="value">{project.shopNumber || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Floor Number</span>
              <span className="value">{project.floorNumber || 'N/A'}</span>
            </div>
          </>
        );
      case 'Apartment':
      case 'Hotel Rooms':
        return (
          <>
            <div className="info-item">
              <span className="label">{project.type === 'Apartment' ? 'Apartment Number' : 'Room Number'}</span>
              <span className="value">{project.unitNumber || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Floor Number</span>
              <span className="value">{project.floorNumber || 'N/A'}</span>
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
        discount: project.discount?.replace('%', '') || '0',
        image: project.image
      }
    });
  };

  return (
    <div className="project-details">
      <div className="project-details-header">
        <Link to="/projects" className="back-button">← Back to Projects</Link>
        <h2>{project.name}</h2>
      </div>

      <div className="project-details-content">
        <div className="project-image-section">
          <img src={project.image} alt={project.name} className="main-image" />
          
          <div className="project-incentives">
            <h3>Special Offers</h3>
            <div className="incentive-content">
              <div className="incentive-item">
                <span className="label">Discount</span>
                <span className="value highlight">{project.discount || 'No discount'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="project-info-section">
          <div className="info-card">
            <h3>Project Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Type</span>
                <span className="value">{project.type}</span>
              </div>
              <div className="info-item">
                <span className="label">Area</span>
                <span className="value">{project.area}</span>
              </div>
              <div className="info-item">
                <span className="label">Location</span>
                <span className="value">{project.location}</span>
              </div>
              {renderInventoryFields()}
            </div>
          </div>

          <div className="description-card">
            <h3>Description</h3>
            <p>{project.description || 'No description available.'}</p>
          </div>

          <div className="project-actions">
            <button className="btn btn-primary book-now" onClick={handleBooking}>
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;