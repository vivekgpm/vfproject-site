import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';

const BookAsset = () => {
  const location = useLocation();
  const { projectId, assetType } = useParams();
  const projectData = location.state;

  const [formData, setFormData] = useState({
    referralId: '',
    unitNumber: '',
    floorNumber: '',
    plotNumber: '',
    direction: '',
    surveyNumber: '',
    shopNumber: ''
  });

  const [pricing, setPricing] = useState({
    totalPrice: projectData?.totalPrice || 0,
    discount: 0,
    finalPrice: 0,
    bookingAmount: 0
  });

  useEffect(() => {
    if (projectData) {
      const total = parseFloat(projectData.totalPrice);
      const discountPercent = parseFloat(projectData.discount);
      const discountAmount = (total * discountPercent) / 100;
      const final = total - discountAmount;
      const booking = final * 0.20; // 20% booking amount

      setPricing({
        totalPrice: total,
        discount: discountAmount,
        finalPrice: final,
        bookingAmount: booking
      });
    }
  }, [projectData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderAssetFields = () => {
    switch (assetType) {
      case 'Residential Plot':
      case 'Commercial Plot':
      case 'Villa':
        return (
          <>
            <div className="form-group">
              <label>Plot Number</label>
              <input
                type="text"
                name="plotNumber"
                value={formData.plotNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Direction</label>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Direction</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>
          </>
        );

      case 'Farm Land':
        return (
          <div className="form-group">
            <label>Survey Number</label>
            <input
              type="text"
              name="surveyNumber"
              value={formData.surveyNumber}
              onChange={handleInputChange}
              required
            />
          </div>
        );

      case 'Commercial Shop':
      case 'Apartment':
      case 'Hotel Rooms':
        return (
          <>
            <div className="form-group">
              <label>
                {assetType === 'Commercial Shop' ? 'Shop Number' : 
                 assetType === 'Apartment' ? 'Apartment Number' : 'Room Number'}
              </label>
              <input
                type="text"
                name="unitNumber"
                value={formData.unitNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Floor Number</label>
              <input
                type="number"
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleInputChange}
                required
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking Data:', {
      ...formData,
      projectId,
      assetType,
      ...pricing
    });
  };

  if (!projectData) {
    return (
      <div className="not-found">
        <h2>No booking details found</h2>
        <Link to="/projects" className="btn btn-primary">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="book-asset-container">
      <div className="booking-header">
        <Link to={`/projects/${projectId}`} className="back-button">
          ← Back to Project
        </Link>
        <h2>Book Property</h2>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="property-summary">
          <h3>Property Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Project Name</span>
              <span className="value">{projectData.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Type</span>
              <span className="value">{projectData.type}</span>
            </div>
            <div className="info-item">
              <span className="label">Area</span>
              <span className="value">{projectData.area}</span>
            </div>
            {renderAssetFields()}
            <div className="form-group">
              <label>Referral ID</label>
              <input
                type="text"
                name="referralId"
                value={formData.referralId}
                onChange={handleInputChange}
                placeholder="Enter Referral ID"
              />
            </div>
          </div>
        </div>

        <div className="pricing-details">
          <h3>Pricing Details</h3>
          <div className="price-grid">
            <div className="price-item">
              <span className="label">Total Price</span>
              <span className="value">₹{pricing.totalPrice.toLocaleString()}</span>
            </div>
            <div className="price-item highlight">
              <span className="label">Discount ({projectData.discount}%)</span>
              <span className="value">₹{pricing.discount.toLocaleString()}</span>
            </div>
            <div className="price-item final">
              <span className="label">Final Price</span>
              <span className="value">₹{pricing.finalPrice.toLocaleString()}</span>
            </div>
            <div className="price-item booking">
              <span className="label">Booking Amount (20%)</span>
              <span className="value">₹{pricing.bookingAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary booking-submit">
          Proceed to Payment
        </button>
      </form>
    </div>
  );
};

export default BookAsset;