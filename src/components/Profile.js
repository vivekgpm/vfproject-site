import React from "react";

const Profile = () => {
  const user = {
    name: "John Doe",
    email: "johndoe@example.com",
    memberID: "12345",
    phone:"1234567890"
  };

  const transactions = [
    {
      projectId: 1,
      benefitEarned: "$500",
      transactionDate: "2025-04-01",
    },
    {
      projectId: 2,
      benefitEarned: "$300",
      transactionDate: "2025-04-15",
    },
    {
      projectId: 3,
      benefitEarned: "$700",
      transactionDate: "2025-04-20",
    },
  ];

  return (
    <div>
      <h2 style={{textAlign:"center"}}>Member Details</h2>
      <p>
        <strong>Name:</strong> {user.name}
      </p>
      <p>
        <strong>Phone:</strong> {user.phone}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Member ID:</strong> {user.memberID}
      </p>
      <div className="dashboard-stats">
        <div className="investment-highlights">
          <div className="highlight-box primary">
            <div className="highlight-label">Invested Amount</div>
            <div className="highlight-value">₹5,00,000</div>
          </div>
          <div className="highlight-box primary">
            <div className="highlight-label">Invested On</div>
            <div className="highlight-value">01 Jan 2025</div>
          </div>
          <div className="highlight-box primary">
            <div className="highlight-label">Current Plan</div>
            <div className="highlight-value">Plan A - 5 Lacs</div>
          </div>
          <div className="lifetime-earnings">
            <div className="highlight-label">Lifetime Earnings</div>
            <div className="highlight-value">₹75,000</div>
          </div>
        </div>
      </div>
      <h3>Transaction History</h3>
      <table
        border="1"
        style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th>Project ID</th>
            <th>Benefit Earned</th>
            <th>Transaction Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <tr key={index}>
              <td>{transaction.projectId}</td>
              <td>{transaction.benefitEarned}</td>
              <td>{transaction.transactionDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Profile;
