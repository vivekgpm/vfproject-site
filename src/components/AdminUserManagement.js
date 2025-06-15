// React Component for Admin User Management
import { Link } from "react-router-dom";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

import "../components/AppStyles.css"; // Import your CSS styles
const LoadingOverlay = () => (
  <div className="loading-overlay">
    <div className="loading-content">
      <div className="spinner"></div>
      <p>Loading users...</p>
    </div>
  </div>
);

function AdminUserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("Loading users...");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("bdaId");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [investmentPlanFilter, setInvestmentPlanFilter] = useState("");
  const [pageSize] = useState(10);
  const auth = getAuth();
  const db = getFirestore();

  // Check if the current user is an admin

  // Fetch all users (admin only)
  const fetchUsers = useCallback(async () => {
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL_3}/api/users`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.users || []);
      if (data.users.length === 0) {
        setLoadingMessage("No users found");
      }
      // Extract the users array from the response
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // Check admin status from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
            fetchUsers(); // Load users if admin
          } else {
            setIsAdmin(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, fetchUsers]);

  const handleInvestmentPlanFilterChange = (e) => {
    setInvestmentPlanFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleClearFilter = () => {
    setInvestmentPlanFilter("");
    setSearchTerm(""); // Clear search term as well if desired
    setCurrentPage(1); // Reset to first page
  };

  // Handle form submission to create a new user
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setIsDeleting(true);
      try {
        // Get fresh ID token for authentication
        const idToken = await auth.currentUser.getIdToken(true);

        // Make API call to delete user
        const response = await fetch(
          `${process.env.REACT_APP_API_URL_3}/api/users/${userId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete user");
        }

        // Refresh the users list after successful deletion
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        setErrorMessage(
          error.message || "Failed to delete user. Please try again."
        );
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    let date;
    try {
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
      } else if (timestamp._seconds) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (typeof timestamp === "number") {
        date =
          timestamp > 1000000000000
            ? new Date(timestamp)
            : new Date(timestamp * 1000);
      } else {
        date = new Date(timestamp);
      }

      if (isNaN(date.getTime())) {
        // Invalid date check
        throw new Error("Invalid Date object created");
      }

      const optionsDate = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata', // Set timezone to IST
      };

      const optionsTime = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // For AM/PM
        timeZone: 'Asia/Kolkata', // Set timezone to IST
      };

      // Format date and time parts separately to achieve "DD Mon YYYY HH:MM:SS AM/PM"
      const formattedDate = new Intl.DateTimeFormat('en-GB', optionsDate).format(date).replace(/ /g, '-'); // Added replace to get DD-MMM-YYYY
      const formattedTime = new Intl.DateTimeFormat('en-US', optionsTime).format(date);

      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      console.error("Error formatting date:", error, timestamp);
      return "Invalid Date";
    }
  };

  // Add sorting function
  const sortUsers = (usersToSort) => {
    return [...usersToSort].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (sortField === "createdAt") {
        aVal = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        bVal = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <LoadingOverlay />
      </div>
    );
  }

  if (!currentUser) {
    return <div>Please sign in to access this page.</div>;
  }

  if (!isAdmin) {
    return (
      <div>Access denied. You need admin privileges to view this page.</div>
    );
  }

  // Filter and sort users - moved this logic here to avoid scoping issues
  const filteredUsers = users.filter((user) => {
    const matchesSearchTerm = Object.values(user)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const planAmount = user.planAmount || 0;
    const matchesInvestmentPlan =
      investmentPlanFilter === "" ||
      (investmentPlanFilter === "economy" && planAmount === 500000) ||
      (investmentPlanFilter === "premium" && planAmount === 2000000);

    return matchesSearchTerm && matchesInvestmentPlan;
  });

  const sortedUsers = sortUsers(filteredUsers);

  // Calculate pagination
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const exportUsersToCSV = () => {
    if (filteredUsers.length === 0) {
      alert("No users to export.");
      return;
    }

    const headers = [
      "Investment Plan",
      "BDA ID",
      "Name",
      "Referral ID",
      "Mobile", // Include User ID for reference
      "Email", // Include Email
      "City", //
      "State",
      "Invested Date",
      "Investment Amount",
      "Date of Birth",
      "Remarks",
      "Aadhaar",
      "Pancard",
      "Bank Name",
      "Account Number",
      "IFSC Code",
      "Branch",
      "Address",
      "Nominee Name",
      "Nominee Relation",
      "Nominee Aadhar",
    ];

    const formatDateOnly = (timestamp) => {
      if (!timestamp) return "N/A";

      let date;
      try {
        if (timestamp.toDate && typeof timestamp.toDate === "function") {
          date = timestamp.toDate();
        } else if (timestamp._seconds) {
          date = new Date(timestamp._seconds * 1000);
        } else if (timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000);
        } else if (typeof timestamp === "number") {
          date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
        } else {
          date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) { 
          throw new Error("Invalid Date object created");
        }

        const options = {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        };

        return new Intl.DateTimeFormat('en-GB', options).format(date).replace(/ /g, '-');

      } catch (error) {
        console.error("Error formatting date for export:", error, timestamp);
        return "Invalid Date";
      }
    };

    const rows = filteredUsers.map((user) => [
      `"${user.investmentPlanName || "N/A"}"`,
      `"${user.bdaId || "N/A"}"`,
      `"${user.displayName || "N/A"}"`,
      `"${user.referralId || "N/A"}"`,
      `"${user.phone || "N/A"}"`,
      `"${user.email || "N/A"}"`,
      `"${user.city || "user"}"`,
      `"${user.state || "user"}"`,
      `"${formatDateOnly(user.investmentDate || "N/A")}"`, // Changed to formatDateOnly
      `"${(user.planAmount || 0).toLocaleString("en-IN")}"`,
      `"${user.dateOfBirth || "N/A"}"`,
      `"${user.remarks || "N/A"}"`,
      `"${user.memberAadharCard || "N/A"}"`,
      `"${user.memberPanCard || "N/A"}"`,      
      `"${user.bankName || "N/A"}"`,
      `"${user.accountNo || "N/A"}"`,
      `"${user.ifscCode || "N/A"}"`,
      `"${user.branchName || "N/A"}"`,
      `"${user.address || "N/A"}"`,
      `"${user.nomineeName || "N/A"}"`,
      `"${user.nomineeRelation || "N/A"}"`,
      `"${user.nomineeAadharCard || "N/A"}"`,
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
    link.setAttribute("download", "users_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="admin-management-container">
      <div className="admin-header">
        <div>
          <h1>User Management</h1>
        </div>
        <Link to="/admin" className="back-button">
          <FaArrowLeft /> Back to Admin Panel
        </Link>
      </div>

      <div className="admin-content">
        <div className="users-panel">
          <div className="users-controls">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="investment-plan-filter">
              <label htmlFor="investmentPlan">Filter by Plan:</label>
              <select
                id="investmentPlan"
                value={investmentPlanFilter}
                onChange={handleInvestmentPlanFilterChange}
              >
                <option value="">All Plans</option>
                <option value="economy">Economy (₹5,00,000)</option>
                <option value="premium">Premium (₹20,00,000)</option>
              </select>
              <button
                onClick={handleClearFilter}
                className="btn btn-secondary btn-sm"
              >
                Clear Filter
              </button>
            </div>
            <button onClick={exportUsersToCSV} className="btn btn-primary">
              Export Users (CSV)
            </button>

            <Link to="/admin/add-member" className="btn btn-primary">
              + Add Member
            </Link>
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  {[
                    ["displayName", "Name"],
                    ["bdaId", "BDA ID"],
                    ["phone", "Phone"],
                    ["investmentPlan", "Investment Plan"],
                    ["createdAt", "Created On"],
                    ["actions", "Actions"],
                  ].map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() =>
                        field !== "actions" ? handleSort(field) : null
                      }
                      className={sortField === field ? sortDirection : ""}
                      style={{
                        cursor: field !== "actions" ? "pointer" : "default",
                      }}
                    >
                      {label}
                      {sortField === field && (
                        <span>{sortDirection === "asc" ? " ↑" : " ↓"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.uid}>
                      <td>
                        <Link
                          to={`/admin/user/${user.uid}`}
                          className="user-link"
                        >
                          {user.displayName || user.email}
                        </Link>
                      </td>
                      <td>{user.bdaId || "N/A"}</td>
                      <td>{user.phone || "N/A"}</td>
                      <td>₹{(user.planAmount || 0).toLocaleString("en-IN")}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/admin/edit-profile/${user.uid}`}
                            className="btn btn-warning btn-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
                            className="btn btn-danger btn-sm"
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      {loadingMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;
