import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../components/AppStyles.css";
import {
  getFirestore,
  doc,
  
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import "../components/AppStyles.css"; // Import your CSS styles


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
  const [bdaId, setBdaId] = useState("");

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  useEffect(() => {
    generateBdaId();
  }, []);

  const generateBdaId = async () => {
    try {
      // Get the last BDA ID from the database
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("bdaId", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      
      let newNumber = 1;
      if (!querySnapshot.empty) {
        const lastBdaId = querySnapshot.docs[0].data().bdaId;
        const lastNumber = parseInt(lastBdaId.replace("BDA", ""));
        newNumber = lastNumber + 1;
      }
      
      // Format the new BDA ID
      const newBdaId = `BDA${newNumber.toString().padStart(4, "0")}`;
      setBdaId(newBdaId);
    } catch (error) {
      console.error("Error generating BDA ID:", error);
      setErrorMessage("Error generating BDA ID");
    }
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
      // Convert plan name to amount
      const planAmount = formData.investmentPlan === "Economy Plan" ? "5" : "20";

      const userData = {
        ...formData,
        bdaId,
        investmentPlan: planAmount + " Lacs",
        createdAt: new Date(),
      };

      await addDoc(collection(db, "users"), userData);
      navigate("/admin/newmember");
    } catch (error) {
      console.error("Error adding member:", error);
      setErrorMessage("Error adding member. Please try again.");
    }
  };

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
                <label htmlFor="displayName">Name:</label>
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
                  <option value="Economy Plan">Economy Plan</option>
                  <option value="Premium Plan">Premium Plan</option>
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
            <button type="submit">Add Member</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMember;
