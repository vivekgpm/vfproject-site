// React Component for Admin User Management
import { Link } from "react-router-dom";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  
} from "firebase/firestore";

import "../components/AppStyles.css"; // Import your CSS styles

function AdminUserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

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
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "user"));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [db]);
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
  // Handle input changes

  // Handle form submission to create a new user
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        // Get fresh ID token for authentication
        const idToken = await auth.currentUser.getIdToken(true);
        
        // Make API call to delete user
        const response = await fetch(`${process.env.REACT_APP_API_URL_3}/api/users/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete user");
        }

        // Refresh the users list after successful deletion
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        setErrorMessage(error.message || "Failed to delete user. Please try again.");
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <div>Please sign in to access this page.</div>;
  }

  if (!isAdmin) {
    return (
      <div>Access denied. You need admin privileges to view this page.</div>
    );
  }
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

  // Filter and sort users
  const filteredAndSortedUsers = users.filter((user) =>
    Object.values(user)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);
  const paginatedUsers = sortUsers(filteredAndSortedUsers).slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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
            <Link to="/admin/add-member" className="btn btn-primary">
              + Add Member
            </Link>
          </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>                  {[
                    ["displayName", "Name"],
                    ["bdaId", "BDA ID"],
                    ["phone", "Phone"],
                    ["investmentPlan", "Investment Plan"],
                    ["createdAt", "Created On"],
                    ["actions", "Actions"]
                  ].map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => field !== "actions" ? handleSort(field) : null}
                      className={sortField === field ? sortDirection : ""}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.uid}>
                    <td><Link to={`/admin/user/${user.uid}`} className="user-link">{user.displayName}</Link></td>
                    <td>{user.bdaId}</td>
                    <td>{user.phone}</td>
                    <td>₹{(user.planAmount || 0).toLocaleString('en-IN')}</td>
                    <td>{formatDate(user.createdAt) || "N/A"}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/admin/edit-profile/${user.uid}`} className="btn btn-warning btn-sm">Edit</Link>
                        <button onClick={() => handleDeleteUser(user.uid)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;
