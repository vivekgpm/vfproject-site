import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../components/AppStyles.css";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import "../components/AppStyles.css"; // Import your CSS styles
import axios from "axios"; // For making API calls to your backend

const AddMember = () => {
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    phone: "",
    address: "",
    investmentPlan: "",
    referralId: "",
    role: "user",
    password: "Complex123!", // Default password
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const db = getFirestore(); // Get Firestore instance
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Add state for current user

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
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
      navigate("/admin/newmember");
    } catch (error) {
      console.error("Error creating user:", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Failed to create user. Please try again."
      );
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);

        // Check admin status from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
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
  }, [auth, db]);

  // ...existing imports...
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="add-member-container">
      <div className="form-header">
        <h2>New Member</h2>
        <Link to="/admin" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>
      </div>

      <div className="form-container">
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <form onSubmit={handleCreateUser} className="create-user-form">
          <div className="form-grid">
            {/* Column 1 */}
            <div className="form-column">
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
            </div>

            {/* Column 2 */}
            <div className="form-column">
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
            </div>

            {/* Column 3 */}
            <div className="form-column">
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
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Create User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMember;
