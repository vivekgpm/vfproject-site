import React from 'react';
import '../components/AppStyles.css';

const Plans = () => {
  return (
    <div className="plans-container">
      <h2 className="plans-title">Our Investment Plans</h2>
      <div className="plans-grid">
        <div className="plan-card featured">
          <div className="plan-header">
            <h3>Plan A - 5 Lacs</h3>
            <div className="plan-price">₹5,00,000</div>
          </div>
          <div className="plan-content">
            <ul className="plan-features">
              <li>Minimum investment: ₹5,00,000</li>
              <li>Lock-in Period: 5 years</li>
              <li>Bonus Time: Starts from 31st month onwards </li>
              <li>Features: Discounts (5-40%), Referral and Sales Incentive</li>
            </ul>
            <button className="btn btn-primary">Select Plan</button>
          </div>
        </div>

        <div className="plan-card">
          <div className="plan-header">
            <h3>Plan A - 20 Lacs</h3>
            <div className="plan-price">₹20,00,000</div>
          </div>
          <div className="plan-content">
            <ul className="plan-features">
              <li>Minimum investment: ₹20,00,000</li>
              <li>Lock-in Period: 5 years</li>
              <li>Bonus Time: Starts from 31st month onwards </li>
              <li>Features: Discounts (5-40%), Referral and Sales Incentive</li>
            </ul>
            <button className="btn btn-primary">Select Plan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;