import React from "react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import "../components/AppStyles.css"; // Import the centralized CSS file

const AdminHome = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLastDayOnly, setShowLastDayOnly] = useState(false);
  const pageSize = 20;

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
        setFilteredTransactions(transactionsData);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((t) => {
        const transactionDate = t.createdAt?.toDate();
        return transactionDate >= start && transactionDate <= end;
      });
    }

    // Apply last day filter
    if (showLastDayOnly) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((t) => {
        const transactionDate = t.createdAt?.toDate();
        return transactionDate >= yesterday && transactionDate < today;
      });
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, startDate, endDate, transactions, showLastDayOnly]);

  // Calculations
  const totalTransactions = filteredTransactions.length;
  const totalIncentives = filteredTransactions.reduce(
    (sum, t) => sum + (t.pricing?.discount || 0),
    0
  );

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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
          <h3>Total Incentives</h3>
          <p>₹{totalIncentives.toLocaleString()}</p>
        </div>
      </div>

      <div className="search-filters">
        <div className="search-field">
          <input
            type="text"
            placeholder="Search by member name or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="date-filters">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
          />
          <label className="last-day-filter">
            <input
              type="checkbox"
              checked={showLastDayOnly}
              onChange={(e) => setShowLastDayOnly(e.target.checked)}
            />
            Show Last Day's Transactions
          </label>
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
      
      <h3>Recent Transactions</h3>
      <div className="table-responsive">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Transaction Date</th>
              <th>Member Name</th>
              <th>Project</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{new Date(transaction.createdAt?.toDate()).toLocaleDateString()}</td>
                <td>{transaction.userDisplayName || 'N/A'}</td>
                <td>{transaction.projectName || 'N/A'}</td>
                <td>₹{transaction.projectName || '0'}</td>
                <td>{transaction.paymentDate ? new Date(transaction.paymentDate).toLocaleDateString() : '-'}</td>
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
                  <Link 
                    to={`/edit-transaction/${transaction.id}`}
                    className="btn btn-warning btn-sm"
                    style={{ marginLeft: '8px' }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminHome;
