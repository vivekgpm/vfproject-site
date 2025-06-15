import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getAllPlans } from "../api/planApi";
import "../components/AppStyles.css";
import { indianStates, countries } from "../utils/constants";

let db;
let auth;

try {
  db = getFirestore();
  auth = getAuth();
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

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
    investmentPlanId: "",
    planAmount: 0,
    referralId: "",
    bdaId: "",
    paymentMode: "",
    remarks: "",
    memberPanCard: "",
    memberAadharCard: "",
    nomineeName: "",
    nomineeRelation: "Other",
    nomineeAadharCard: "",
    accountNo: "",
    bankName: "",
    ifscCode: "",
    branchName: "",
    investmentDate: "",
    dateOfBirth: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [plans, setPlans] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
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
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            displayName: userData.displayName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            address: userData.address || "",
            city: userData.city || "",
            state: userData.state || "Karnataka",
            country: userData.country || "India",
            investmentPlanId: userData.investmentPlanId || "",
            planAmount: userData.planAmount || 0,
            referralId: userData.referralId || "",
            bdaId: userData.bdaId || "",
            paymentMode: userData.paymentMode || "",
            remarks: userData.remarks || "",
            memberPanCard: userData.memberPanCard || "",
            memberAadharCard: userData.memberAadharCard || "",
            nomineeName: userData.nomineeName || "",
            nomineeRelation: userData.nomineeRelation || "Other",
            nomineeAadharCard: userData.nomineeAadharCard || "",
            accountNo: userData.accountNo || "",
            bankName: userData.bankName || "",
            ifscCode: userData.ifscCode || "",
            branchName: userData.branchName || "",
            investmentDate: userData.investmentDate || "",
            dateOfBirth: userData.dateOfBirth || "",
          });
        } else {
          setErrorMessage("User not found");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setErrorMessage("Error loading user data");
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await getAllPlans();
        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching plans:", error);
        setErrorMessage("Error loading investment plans");
      }
    };

    fetchPlans();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (
      [
        "displayName",
        "city",
        "bankName",
        "branchName",
        "nomineeName",
        "memberPanCard",
        "ifscCode",
        "dateOfBirth",
      ].includes(name)
    ) {
      setFormData({
        ...formData,
        [name]: value.toUpperCase(),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
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
    setIsSubmitting(true);

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        planAmount: Number(formData.planAmount),
        paymentMode: formData.paymentMode,
        remarks: formData.remarks,
        memberPanCard: formData.memberPanCard,
        memberAadharCard: formData.memberAadharCard,
        nomineeName: formData.nomineeName,
        nomineeRelation: formData.nomineeRelation,
        nomineeAadharCard: formData.nomineeAadharCard,
        accountNo: formData.accountNo,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        investmentDate: formData.investmentDate,
        dateOfBirth: formData.dateOfBirth,
      });

      setSuccessMessage("Profile updated successfully!");
      setShowSuccessPopup(true);

      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate("/admin/newmember");
      }, 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="add-member-container">
      <div className="form-header">
        <h2>Edit BDA Member Profile</h2>
        <Link to="/admin/newmember" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Members List
        </Link>
      </div>

      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <i className="fas fa-check-circle"></i>
            <div>
              <h3>Success!</h3>
              <p>Profile has been updated successfully.</p>
            </div>
          </div>
        </div>
      )}

      <div className="form-container">
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="create-user-form">
          {/* Personal Information */}
          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="displayName">Full Name:</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                  style={{ textTransform: "capitalize" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number:</label>
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
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">City:</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter city name"
                  style={{ textTransform: "capitalize" }}
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
            <div className="form-group-full">
              <label htmlFor="address">Complete Address:</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="Enter complete address"
                rows="2"
              />
            </div>
          </div>

          {/* Member Identification & Investment Details Combined */}
          <div className="form-section">
            <h3 className="section-title">
              Member Identification & Investment
            </h3>
            <div className="form-grid">
           
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth:</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="memberPanCard">PAN Card Number:</label>
                <input
                  type="text"
                  id="memberPanCard"
                  name="memberPanCard"
                  value={formData.memberPanCard}
                  onChange={handleInputChange}
                  title="Enter valid PAN card number (e.g., ABCDE1234F)"
                  placeholder="PAN Card"
                  maxLength={10}
                  style={{ textTransform: "capitalize" }}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="memberAadharCard">Aadhar Card Number:</label>
                <input
                  type="number"
                  id="memberAadharCard"
                  name="memberAadharCard"
                  value={formData.memberAadharCard}
                  onChange={handleInputChange}
                  title="Enter valid 12-digit Aadhar number"
                  placeholder="Aadhar Card"
                  maxLength={12}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="planAmount">Investment Amount:</label>
                <input
                  type="number"
                  id="planAmount"
                  name="planAmount"
                  value={formData.planAmount}
                  onChange={handleInputChange}
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}                 
                  disabled
                />
              </div>
              <div className="form-group">
                <label htmlFor="paymentMode">Payment Mode:</label>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="investmentDate">Investment Date:</label>
                <input
                  type="date"
                  id="investmentDate"
                  name="investmentDate"
                  value={formData.investmentDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
             
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="accountNo">Account Number:</label>
                <input
                  type="number"
                  id="accountNo"
                  name="accountNo"
                  value={formData.accountNo}
                  onChange={handleInputChange}
                 
                />
              </div>
              <div className="form-group">
                <label htmlFor="bankName">Bank Name:</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter bank name"
                  style={{ textTransform: "capitalize" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code:</label>
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter IFSC code"
                />
              </div>
              <div className="form-group">
                <label htmlFor="branchName">Branch Name:</label>
                <input
                  type="text"
                  id="branchName"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter branch name"
                  style={{ textTransform: "capitalize" }}
                />
              </div>
            </div>
            <div className="form-group-full">
              <label htmlFor="remarks">Additional Remarks:</label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="2"
                placeholder="Additional notes or remarks"
              />
            </div>
          </div>

          {/* Nominee & Bank Details Combined */}
          <div className="form-section">
            <h3 className="section-title">Nominee Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nomineeName">Nominee Name:</label>
                <input
                  type="text"
                  id="nomineeName"
                  name="nomineeName"
                  value={formData.nomineeName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter nominee's name"
                  style={{ textTransform: "capitalize" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="nomineeRelation">Relationship:</label>
                <select
                  id="nomineeRelation"
                  name="nomineeRelation"
                  value={formData.nomineeRelation}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Wife">Wife</option>
                  <option value="Husband">Husband</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Sister">Sister</option>
                  <option value="Brother">Brother</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="nomineeAadharCard">
                  Nominee Aadhar Number:
                </label>
                <input
                  type="number"
                  id="nomineeAadharCard"
                  name="nomineeAadharCard"
                  value={formData.nomineeAadharCard}
                  onChange={handleInputChange}
                  title="Enter valid 12-digit Aadhar number"
                  placeholder="Nominee Aadhar"
                  maxLength={12}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Updating Profile...
                </>
              ) : (
                "Update Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;