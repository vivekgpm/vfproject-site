import React from "react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import "../components/AppStyles.css"; // Import the centralized CSS file

const AdminHome = () => {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [userMap, setUserMap] = useState({}); // New state for userId to displayName mapping
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLastDayOnly, setShowLastDayOnly] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users first
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);

        // Create userId to displayName mapping
        const userMapping = {};
        usersData.forEach((user) => {
          userMapping[user.bdaId] =
            user.displayName || user.name || user.email || "Unknown User";
        });
        setUserMap(userMapping);

        // Fetch transactions
        const transactionsRef = collection(db, "transactions");
        const transactionQuery = query(
          transactionsRef,
          orderBy("createdAt", "desc")
        );
        const transactionSnapshot = await getDocs(transactionQuery);
        const transactionsData = transactionSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Apply search filter - now search includes mapped display names
    if (searchTerm) {
      filtered = filtered.filter((t) => {
        const displayName = userMap[t.userId] || "";
        return (
          displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.userDisplayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.userId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
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
  }, [searchTerm, startDate, endDate, transactions, showLastDayOnly, userMap]);

  // Helper function to get display name
  const getUserDisplayName = (userId) => {
    return userMap[userId] || userId || "N/A";
  };

  // Calculations
  const totalTransactions = filteredTransactions.length;
  const totalInvestments = users.reduce(
    (sum, user) => sum + (user.planAmount || 0),
    0
  );
  const totalIncentives = filteredTransactions.reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );
  const totalPaid = filteredTransactions.reduce(
    (sum, t) => (t.paymentDate ? sum + (t.amount || 0) : sum),
    0
  );

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) return <div>Loading...</div>;

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    // Check if it's a Firestore Timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    // Check if it's a regular timestamp
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    // If it's already a Date object or string
    return new Date(timestamp).toLocaleString();
  };

  const exportTransactionsToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export.");
      return;
    }

    const headers = [
      "Transaction Date",
      "Member Name",
      "Type",
      "Amount",
      "Payment Date",
      "Status",
      "Transaction ID", // Include ID for reference
    ];

    const rows = filteredTransactions.map((t) => [
      `"${formatDate(t.createdAt)}"`, // Wrap in quotes to handle commas
      `"${getUserDisplayName(t.userId)}"`, // Use the mapped display name
      `"${t.type === "assetPurchase" ? "Asset Purchase" : t.type || "N/A"}"`,
      `"${t.amount?.toLocaleString("en-IN") || "0"}"`,
      `"${t.paymentDate ? new Date(t.paymentDate).toLocaleDateString() : "-"}"`,
      `"${t.status || "Pending"}"`,
      `"${t.id}"`,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "transactions_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-home">
      <h2>Admin Home</h2>

      <div className="admin-stats">
        <div className="stat-card">
          <h3>Total Transactions</h3>
          <p>{totalTransactions}</p>
        </div>
        <div className="stat-card">
          <h3>Total Investments</h3>
          <p>₹{totalInvestments.toLocaleString("en-IN")}</p>
        </div>
        <div className="stat-card">
          <h3>Total Incentives</h3>
          <p>₹{totalIncentives.toLocaleString("en-IN")}</p>
        </div>
        <div className="stat-card">
          <h3>Total Paid</h3>
          <p>₹{totalPaid.toLocaleString("en-IN")}</p>
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
        <Link to="/admin/manage-asset-transactions" className="admin-button">
          Manage Asset Purchase
        </Link>
        <Link onClick={exportTransactionsToCSV} className="admin-button">
          Export Transactions (CSV)
        </Link>
      </div>

      <h3>Recent Transactions</h3>
      <div className="table-responsive">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Transaction Date</th>
              <th>Member Name</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.createdAt)}</td>
                <td>{getUserDisplayName(transaction.userId)}</td>
                <td>
                  {transaction.type === "assetPurchase"
                    ? "Asset Purchase"
                    : transaction.type}
                </td>
                <td>₹{transaction.amount.toLocaleString("en-IN") || "0"}</td>
                <td>
                  {transaction.paymentDate
                    ? new Date(transaction.paymentDate).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <span
                    className={`status-badge ${transaction.status?.toLowerCase()}`}
                  >
                    {transaction.status || "Pending"}
                  </span>
                </td>
                <td>
                  {transaction.type !== "Referral" && (
                    <Link
                      to={`/booking-details/${transaction.id}`}
                      className="btn btn-info btn-sm"
                    >
                      View Details
                    </Link>
                  )}
                  <Link
                    to={`/edit-transaction/${transaction.id}`}
                    className="btn btn-warning btn-sm"
                    style={{ marginLeft: "8px" }}
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
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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
