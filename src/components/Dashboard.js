  <div className="dashboard-highlights">
    <div className="highlight-card">
      <div className="highlight-icon">
        <i className="fas fa-wallet"></i>
      </div>
      <div className="highlight-content">
        <h3>Lifetime Earnings</h3>
        <p className="highlight-value">₹{formatNumber(lifetimeEarnings)}</p>
      </div>
    </div>

    <div className="highlight-card">
      <div className="highlight-icon">
        <i className="fas fa-chart-line"></i>
      </div>
      <div className="highlight-content">
        <h3>Current Investment Plan</h3>
        <p className="highlight-value">{userData?.investmentPlan || 'No Plan'}</p>
        <p className="highlight-subtext">₹{formatNumber(userData?.planAmount || 0)}</p>
      </div>
    </div>
  </div> 