// React Component for Admin User Management
import { Link } from "react-router-dom";
import { FaSearch, FaArrowLeft, FaEdit, FaTrash } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { formatDate } from "../utils/dateFunctions.js"; // Import your date formatting function
import "../styles/AppStyles.css"; // Import your CSS styles

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
  const [pageSize] = useState(30);
  const [totalUsers, setTotalUsers] = useState(0);
  const auth = getAuth();
  const db = getFirestore();

  // Check if the current user is an admin

  // Fetch users for the current page (admin only, paginated)
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      const params = new URLSearchParams({
        page: currentPage,
        pageSize,
        search: searchTerm,
        investmentPlan: investmentPlanFilter,
        sortField,
        sortDirection,
      });
      const response = await fetch(
        `${process.env.REACT_APP_API_URL_3}/api/users?${params.toString()}`,
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
      setTotalUsers(data.totalCount || 0);
      if (!data.users || data.users.length === 0) {
        setLoadingMessage("No users found");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [
    auth,
    currentPage,
    pageSize,
    searchTerm,
    investmentPlanFilter,
    sortField,
    sortDirection,
  ]);

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

  // Refetch users when pagination, search, filter, or sort changes
  useEffect(() => {
    if (isAdmin) fetchUsers();
    // eslint-disable-next-line
  }, [
    currentPage,
    pageSize,
    searchTerm,
    investmentPlanFilter,
    sortField,
    sortDirection,
    isAdmin,
  ]);

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

  // Calculate pagination
  const totalPages = Math.ceil(totalUsers / pageSize);
  const paginatedUsers = users; // Already paginated from server

  const exportUsersToCSV = async () => {
    setIsLoading(true);
    try {
      // Get fresh token
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error("Not authorized. Please login again.");
      }

      const params = new URLSearchParams({
        pageSize: 5000,
        search: searchTerm,
        investmentPlan: investmentPlanFilter,
        sortField: "bdaId",
        sortDirection: "asc",
      });

      const response = await fetch(
        `${process.env.REACT_APP_API_URL_3}/api/users?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      const allUsers = data.users || [];

      if (allUsers.length === 0) {
        alert("No users to export.");
        return;
      }

      const headers = [
        "Investment Plan",
        "BDA ID",
        "Name",
        "Referral ID",
        "Referrer Name",
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
            date =
              timestamp > 1000000000000
                ? new Date(timestamp)
                : new Date(timestamp * 1000);
          } else {
            date = new Date(timestamp);
          }

          if (isNaN(date.getTime())) {
            throw new Error("Invalid Date object created");
          }

          const options = {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Kolkata",
          };

          return new Intl.DateTimeFormat("en-GB", options)
            .format(date)
            .replace(/ /g, "-");
        } catch (error) {
          console.error("Error formatting date for export:", error, timestamp);
          return "Invalid Date";
        }
      };
      const rows = allUsers
        .map((user) => ({ id: user.id, ...user }))
        .sort((a, b) => {
          const bdaIdA = parseInt(a.bdaId?.replace("BDA", "") || "0");
          const bdaIdB = parseInt(b.bdaId?.replace("BDA", "") || "0");
          return bdaIdA - bdaIdB;
        })
        .map((user) => [
          `"${user.investmentPlanName || "N/A"}"`,
          `"${user.bdaId || "N/A"}"`,
          `"${user.displayName || "N/A"}"`,
          `"${user.referrerBdaId || "N/A"}"`,
          `"${user.referrerName || "N/A"}"`,
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
    } catch (error) {
      console.error("Error exporting users:", error);
      alert(`Failed to export users: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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
                            <FaEdit />
                          </Link>
                          <Link
                            onClick={() => handleDeleteUser(user.uid)}
                            className="btn btn-danger btn-sm"
                            disabled={isDeleting} title="Delete User"
                          >
                           
                            {isDeleting ? "Deleting..." :  <FaTrash />}
                          </Link>
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
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="page-select"
              >
                {[...Array(totalPages)].map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    Page {index + 1}
                  </option>
                ))}
              </select>
              <span> of {totalPages}</span>
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
