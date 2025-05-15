import React from "react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import "../components/AppStyles.css"; // Import the centralized CSS file

const AdminHome = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactionsRef = collection(db, "transactions");
        const q = query(transactionsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const transactionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(transactionsData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Calculations
  const totalTransactions = transactions.length;
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const totalIncentives = transactions.reduce(
    (sum, t) => sum + (t.pricing?.incentive || 0),
    0
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-home">
      <h2>Admin Dashboard</h2>
      
      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p>{totalTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Transactions</h3>
          <p>{pendingTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Total Incentives</h3>
          <p>₹{totalIncentives.toLocaleString()}</p>
        </div>
      </div>
      <div className="admin-actions">
        <Link to="/admin/add-member" className="admin-button">
          Add New Member
        </Link>
        <Link to="/admin/newmember" className="admin-button">
          Manage Members
        </Link>
       
      </div>
      <div className="transactions-section">
        <h3>Recent Transactions</h3>
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member Name</th>
                <th>Project</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.createdAt?.toDate()).toLocaleDateString()}</td>
                  <td>{transaction.userDisplayName || 'N/A'}</td>
                  <td>{transaction.projectName || 'N/A'}</td>
                  <td>₹{transaction.pricing.discount?.toLocaleString() || '0'}</td>
                  <td>
                    <span className={`status-badge ${transaction.status?.toLowerCase()}`}>
                      {transaction.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/booking-details/${transaction.id}`}
                      className="btn btn-info btn-sm"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

   
    </div>
  );
};

export default AdminHome;
