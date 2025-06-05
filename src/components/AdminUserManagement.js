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
  const [sortField, setSortField] = useState("displayName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
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

    try {
      // Check if it's a Firestore Timestamp with toDate method
      if (timestamp.toDate && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleString();
      }

      // Check if it's a Firestore timestamp object with _seconds property
      if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toLocaleString();
      }

      // Check if it's a regular timestamp object with seconds property
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      }

      // If it's a number (Unix timestamp)
      if (typeof timestamp === "number") {
        // Check if it's in seconds or milliseconds
        const date =
          timestamp > 1000000000000
            ? new Date(timestamp)
            : new Date(timestamp * 1000);
        return date.toLocaleString();
      }

      // If it's already a Date object or string
      return new Date(timestamp).toLocaleString();
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
  const filteredUsers = users.filter((user) =>
    Object.values(user)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const sortedUsers = sortUsers(filteredUsers);

  // Calculate pagination
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
