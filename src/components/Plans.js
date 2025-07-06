import React from "react";
import '../styles/AppStyles.css'; // Import your CSS styles

const Plans = () => {
  return (
    <div className="plans-container">
      <h2 className="plans-title">Our Investment Plans</h2>
      <div className="plans-grid">
        <div className="plan-card featured">
          <div className="plan-header">
            <h3>Economy Plan</h3>
          </div>
          <div className="plan-content">
            <ul className="plan-features">
              <li>Minimum investment: ₹5,00,000</li>
              <li>Lock-in Period: 5 years</li>
              <li>Bonus Time: Starts from 37th month onwards </li>
              <li>Features: Discounts (5-30%), Referral and Sales Incentive</li>
              <li>Retunrs: Up to 4x</li>
            </ul>
          </div>
        </div>

        <div className="plan-card">
          <div className="plan-header">
            <h3>Premium Plan</h3>
          </div>
          <div className="plan-content">
            <ul className="plan-features">
              <li>Minimum investment: ₹20,00,000</li>
              <li>Lock-in Period: 5 years</li>
              <li>Bonus Time: Starts from 37th month onwards </li>
              <li>Features: Discounts (5-30%), Referral and Sales Incentive</li>
              <li>Retunrs: Up to 4x</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
