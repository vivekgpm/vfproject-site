import React from "react";
import { projects } from "../data";
import { Link } from 'react-router-dom';
import "../components/AppStyles.css"; // Import the centralized CSS file

const AdminHome = () => {
  const transactions = [
    {
      id: 1,
      userId: 101,
      projectId: 1,
      benefitEarned: 500,
      transactionDate: "2025-04-01",
      status: "pending",
    },
    {
      id: 2,
      userId: 102,
      projectId: 2,
      benefitEarned: 300,
      transactionDate: "2025-04-15",
      status: "approved",
    },
    {
      id: 3,
      userId: 103,
      projectId: 3,
      benefitEarned: 700,
      transactionDate: "2025-04-20",
      status: "rejected",
    },
    {
      id: 4,
      userId: 104,
      projectId: 1,
      benefitEarned: 400,
      transactionDate: "2025-04-25",
      status: "pending",
    },
  ];

  // Calculations
  const totalTransactions = transactions.length;
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const totalBenefitEarned = transactions.reduce(
    (sum, t) => sum + t.benefitEarned,
    0
  );

  return (
    <div>
    
      {/* Add Member Button */}
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <Link to="/admin/add-member" className="btn btn-primary">
          + Add Member
        </Link>
      </div>
      {/* Metrics Panels */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={{ border: "1px solid #ccc", padding: "10px", flex: 1 }}>
          <h3>Total Transactions</h3>
          <p>{totalTransactions}</p>
        </div>
        <div style={{ border: "1px solid #ccc", padding: "10px", flex: 1 }}>
          <h3>Pending Transactions</h3>
          <p>{pendingTransactions}</p>
        </div>
        <div style={{ border: "1px solid #ccc", padding: "10px", flex: 1 }}>
          <h3>Total Benefit Earned</h3>
          <p>${totalBenefitEarned}</p>
        </div>
      </div>

      <h3>Project Management</h3>
      <table
        border="1"
        style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th>Type</th>
            <th>Place</th>
            <th>Area</th>
            <th>Location</th>
            <th>Referral ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.type}</td>
              <td>{project.place}</td>
              <td>{project.area}</td>
              <td>{project.location}</td>
              <td>{project.referralId}</td>
              <td>
                <button>Edit</button>
                <button>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Transaction Management</h3>
      <table
        border="1"
        style={{ width: "100%", textAlign: "left", marginTop: "20px" }}
      >
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>User ID</th>
            <th>Project ID</th>
            <th>Benefit Earned</th>
            <th>Transaction Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.userId}</td>
              <td>{transaction.projectId}</td>
              <td>${transaction.benefitEarned}</td>
              <td>{transaction.transactionDate}</td>
              <td>{transaction.status}</td>
              <td>
                {transaction.status === "pending" ? (
                  <>
                    <button>Approve</button>
                    <button>Reject</button>
                  </>
                ) : (
                  <span>
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminHome;
