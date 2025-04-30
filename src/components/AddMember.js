import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../components/AppStyles.css";

const AddMember = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    investmentPlan: "",
    referralId: "",
  });

  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation
    if (name === 'phone') {
      if (value === '' || (/^\d+$/.test(value) && value.length <= 10)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validation checks
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log("Form Data:", formData);
  };

  return (
    <div className="add-member-container">
      <div className="form-header">
        <h2>New Member</h2>
        <Link to="/admin" className="btn btn-secondary back-to-dashboard">
          Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="member-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength="10"
              placeholder="10 digit number"
              required
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="investmentPlan">Investment Plan:</label>
            <select
              id="investmentPlan"
              name="investmentPlan"
              value={formData.investmentPlan}
              onChange={handleChange}
              required
            >
              <option value="">Select a plan</option>
              <option value="plan-A-5">Plan A - 5 Lacs</option>
              <option value="plan-A-20">Plan A - 20 Lacs</option>
            </select>
          </div>

          <div className="form-group span-full">
            <label htmlFor="address">Address:</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="referralId">Referral ID:</label>
            <input
              type="text"
              id="referralId"
              name="referralId"
              value={formData.referralId}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMember;