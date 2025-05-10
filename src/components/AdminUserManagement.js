// React Component for Admin User Management
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaArrowLeft,
} from "react-icons/fa";
import { useState, useEffect, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import axios from "axios"; // For making API calls to your backend
import "../components/AppStyles.css"; // Import your CSS styles
function AdminUserManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    phone: "",
    address: "",
    investmentPlan: "",
    referralId: "",
    role: "user",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = [];

      usersSnapshot.forEach((doc) => {
        usersList.push({
          uid: doc.id,
          ...doc.data(),
        });
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to load users. Please try again.");
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
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission to create a new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isAdmin) {
      setErrorMessage("You must be an admin to create users");
      return;
    }

    try {
      // Get current user's ID token for authorization
      const idToken = await auth.currentUser.getIdToken();

      // FIXED: Use the full backend URL
      const BACKEND_URL = "http://localhost:3001"; // Change this to your backend URL
      const response = await axios.post(`${BACKEND_URL}/api/users`, formData, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const { uid } = response.data;
      await setDoc(doc(db, "users", uid), {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        investmentPlan: formData.investmentPlan,
        referralId: formData.referralId,
        role: formData.role,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
      });
      // Reset form and show success message
      setFormData({
        email: "",
        password: "",
        displayName: "",
        phone: "",
        address: "",
        investmentPlan: "",
        referralId: "",
        role: "user",
      });

      setSuccessMessage("User created successfully!");

      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to create user. Please try again."
      );
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
            <button
              className="toggle-panel-button"
              onClick={() => setIsPanelOpen(!isPanelOpen)}
            >
              {isPanelOpen ? (
                <>
                  Hide Add User <FaChevronUp />
                </>
              ) : (
                <>
                  Show Add User <FaChevronDown />
                </>
              )}
            </button>
          </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  {[
                    ["displayName", "Display Name"],
                    ["email", "Email"],
                    ["phone", "Phone"],
                    ["investmentPlan", "Investment Plan"],
                    ["referralId", "Referral ID"],
                    ["role", "Role"],
                    ["createdAt", "Created At"],
                  ].map(([field, label]) => (
                    <th
                      key={field}
                      onClick={() => handleSort(field)}
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
                    <td>{user.displayName}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{user.investmentPlan} Lacs</td>
                    <td>{user.referralId || "N/A"}</td>
                    <td>{user.role}</td>
                    <td>{formatDate(user.createdAt) || "N/A"}</td>
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

        <div className={`add-user-panel ${isPanelOpen ? "open" : ""}`}>
          <div className="admin-panel">
            <h1>Admin User Management</h1>

            {/* Create User Form */}
            <div className="create-user-form">
              <h2>Create New User</h2>

              {errorMessage && (
                <div className="error-message">{errorMessage}</div>
              )}
              {successMessage && (
                <div className="success-message">{successMessage}</div>
              )}

              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="displayName">Display Name:</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role:</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone:</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    pattern="[0-9]{10}"
                    title="Please enter a valid 10-digit phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address:</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="investmentPlan">Investment Plan:</label>
                  <select
                    id="investmentPlan"
                    name="investmentPlan"
                    value={formData.investmentPlan}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a plan</option>
                    <option value="5">5 Lacs</option>
                    <option value="20">20 Lacs</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="referralId">Referral ID:</label>
                  <input
                    type="text"
                    id="referralId"
                    name="referralId"
                    value={formData.referralId}
                    onChange={handleInputChange}
                  />
                </div>
                <button type="submit">Create User</button>
              </form>
            </div>

            {/* User List */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserManagement;
