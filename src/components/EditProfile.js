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
import { indianStates, countries } from "../utils/constants"; // Import constants

const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "Karnataka", // Default state
    country: "India", // Default country
    investmentPlanId: "", // Store plan ID if available
    planAmount: 0, // Store plan amount
    referralId: "",
    bdaId: "",
    paymentMode: "", // Added paymentMode
    remarks: "", // Added remarks
    memberPanCard: "", // Added member PAN
    memberAadharCard: "", // Added member Aadhar
    nomineeName: "", // Added nominee details
    nomineeRelation: "Spouse", // Default nominee relation
    nomineePanCard: "", // Added nominee PAN
    nomineeAadharCard: "", // Added nominee Aadhar
    accountNo: "", // Added bank details
    bankName: "",
    ifscCode: "",
    branchName: "",
    investmentDate: "", // Added investment date
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
          const userData = userDoc.data();
          // Populate formData with all available user data
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
            nomineeRelation: userData.nomineeRelation || "Spouse",
            nomineePanCard: userData.nomineePanCard || "",
            nomineeAadharCard: userData.nomineeAadharCard || "",
            accountNo: userData.accountNo || "",
            bankName: userData.bankName || "",
            ifscCode: userData.ifscCode || "",
            branchName: userData.branchName || "",
            investmentDate: userData.investmentDate || "",
          });
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
      // Only update fields that are meant to be editable
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        planAmount: Number(formData.planAmount), // Ensure planAmount is a number
        paymentMode: formData.paymentMode,
        remarks: formData.remarks,
        memberPanCard: formData.memberPanCard,
        memberAadharCard: formData.memberAadharCard,
        nomineeName: formData.nomineeName,
        nomineeRelation: formData.nomineeRelation,
        nomineePanCard: formData.nomineePanCard,
        nomineeAadharCard: formData.nomineeAadharCard,
        accountNo: formData.accountNo,
        bankName: formData.bankName,
        ifscCode: formData.ifscCode,
        branchName: formData.branchName,
        investmentDate: formData.investmentDate,
        // Do NOT update email, bdaId, referralId, investmentPlanId here
      });
      setSuccessMessage("Profile updated successfully!");

      // Navigate back after 2 seconds
      setTimeout(() => {
        navigate("/admin/newmember"); // Assuming this navigates back to the members list
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="add-member-container"> {/* Reusing class for consistent styling */}
      <div className="form-header">
        <h2>Edit Member Profile</h2>
        <Link to="/admin/newmember" className="back-button">
          <FaArrowLeft /> Back to Members List
        </Link>
      </div>

      <div className="form-container"> {/* Reusing class for consistent styling */}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="create-user-form"> {/* Reusing class for consistent styling */}

          {/* Personal Information Section */}
          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="form-row">
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled // Email is typically not editable
                />
              </div>
               <div className="form-group">
                <label htmlFor="bdaId">BDA ID:</label>
                <input
                  type="text"
                  id="bdaId"
                  name="bdaId"
                  value={formData.bdaId}
                  disabled // BDA ID is not editable
                />
              </div>
            </div>

            <div className="form-row">
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
            </div>

             <div className="form-row">
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
               <div className="form-group">
                <label htmlFor="referralId">Referral ID:</label>
                 <input
                  type="text"
                  id="referralId"
                  name="referralId"
                  value={formData.referralId}
                  disabled // Referral ID is not editable
                />
              </div>
            </div>


            <div className="form-row full-width">
              <div className="form-group">
                <label htmlFor="address">Complete Address:</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter complete address"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Member Identification Section */}
          <div className="form-section">
            <h3 className="section-title">Member Identification</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="memberPanCard">Member PAN Card Number:</label>
                <input
                  type="text"
                  id="memberPanCard"
                  name="memberPanCard"
                  value={formData.memberPanCard}
                  onChange={handleInputChange}
                  title="Enter valid PAN card number (e.g., ABCDE1234F)"
                  placeholder="ABCDE1234F"
                />
              </div>
              <div className="form-group">
                <label htmlFor="memberAadharCard">Member Aadhar Card Number:</label>
                <input
                  type="text"
                  id="memberAadharCard"
                  name="memberAadharCard"
                  value={formData.memberAadharCard}
                  onChange={handleInputChange}
                  title="Enter valid 12-digit Aadhar number"
                  placeholder="123456789012"
                />
              </div>
            </div>
          </div>

          {/* Investment Details Section */}
          <div className="form-section">
            <h3 className="section-title">Investment Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="planAmount">Investment Amount:</label>
                <input
                  type="number" // Changed to number type
                  id="planAmount"
                  name="planAmount"
                  value={formData.planAmount}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter investment amount"
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
                  <option value="">Select mode</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                   <option value="Cash">Cash</option>
                </select>
              </div>
            </div>
            <div className="form-row">
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
               <div className="form-group">
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
          </div>

          {/* Nominee Section */}
          <div className="form-section nominee-section">
            <h3 className="section-title">Nominee Details</h3>
            <div className="form-row">
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
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nomineePanCard">Nominee PAN Card Number:</label>
                <input
                  type="text"
                  id="nomineePanCard"
                  name="nomineePanCard"
                  value={formData.nomineePanCard}
                  onChange={handleInputChange}
                  title="Enter valid PAN card number (e.g., ABCDE1234F)"
                  placeholder="ABCDE1234F"
                />
              </div>
              <div className="form-group">
                <label htmlFor="nomineeAadharCard">Nominee Aadhar Card Number:</label>
                <input
                  type="text"
                  id="nomineeAadharCard"
                  name="nomineeAadharCard"
                  value={formData.nomineeAadharCard}
                  onChange={handleInputChange}
                  title="Enter valid 12-digit Aadhar number"
                  placeholder="123456789012"
                />
              </div>
            </div>
          </div>

          {/* Bank Details Section */}
          <div className="form-section bank-section">
            <h3 className="section-title">Bank Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountNo">Account Number:</label>
                <input
                  type="text"
                  id="accountNo"
                  name="accountNo"
                  value={formData.accountNo}
                  onChange={handleInputChange}
                  placeholder="Enter account number"
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
                  placeholder="Enter bank name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code:</label>{" "}
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
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
                  placeholder="Enter branch name"
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
