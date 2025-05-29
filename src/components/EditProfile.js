import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { FaArrowLeft } from "react-icons/fa";
import "../components/AppStyles.css";

// List of Indian states (reuse from AddMember)
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// List of countries
const countries = [
  "India", "Afghanistan", "Australia", "Bangladesh", "Bhutan", "Canada",
  "China", "France", "Germany", "Indonesia", "Japan", "Malaysia", "Maldives",
  "Nepal", "New Zealand", "Pakistan", "Russia", "Singapore", "Sri Lanka",
  "Thailand", "United Arab Emirates", "United Kingdom", "United States"
];

const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Karnataka",
    country: "India",
    planAmount: 0,
    bdaId: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const db = getFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setFormData(userDoc.data());
        } else {
          setErrorMessage("User not found");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setErrorMessage("Error loading user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [db, userId]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, formData);
      setSuccessMessage("Profile updated successfully!");
      
      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate("/admin/newmember");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="add-member-container">
      <div className="form-header">
        <h2>Edit Member Profile</h2>
        <Link to="/admin/newmember" className="back-button">
          <FaArrowLeft /> Back to Members List
        </Link>
      </div>

      <div className="form-container">
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="create-user-form">
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
                  onChange={handlePhoneChange}
                  required
                  maxLength="10"
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
                <label htmlFor="city">City:</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="state">State:</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                >
                  {indianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="country">Country:</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 4 */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="planAmount">Investment Amount:</label>
                <input
                  type="number"
                  id="planAmount"
                  name="planAmount"
                  value={formData.planAmount}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="bdaId">BDA ID:</label>
                <input
                  type="text"
                  id="bdaId"
                  name="bdaId"
                  value={formData.bdaId}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
