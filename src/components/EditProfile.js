import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
  addDoc,
  updateDoc as updateFirestoreDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import '../styles/AppStyles.css'; // Import your CSS styles
import UserSearchSelect from "./UserSearchSelect";
import { getAllPlans } from "../api/planApi";
import { indianStates, countries } from "../utils/constants";
import { getAuth } from "firebase/auth";

const EditProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [plans, setPlans] = useState([]);
  const [existingReferralTxnId, setExistingReferralTxnId] = useState(null);
  const [referralChanged, setReferralChanged] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    phone: "",
    address: "",
    city: "",
    state: "Karnataka",
    country: "India",
    investmentPlanName: "",
    referralId: "",
    role: "",
    dateOfBirth: "",
    paymentMode: "Online",
    remarks: "",
    memberPanCard: "",
    memberAadharCard: "",
    nomineeName: "",
    nomineeRelation: "",
    nomineeAadharCard: "",
    accountNo: "",
    bankName: "",
    ifscCode: "",
    branchName: "",
    investmentDate: "",
    referrerName: "",
    referrerBdaId: "",
    bdaId: "",
    planAmount: "",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData((prevData) => ({
            ...prevData,
            ...userData,
            nomineeRelation: userData.nomineeRelation || "",
            investmentPlanName: userData.investmentPlanName || "",
            investmentDate: userData.investmentDate || "",
            referralId: userData.referralId || "",
          }));

          const txnQuery = query(
            collection(db, "transactions"),
            where("referredUserId", "==", userId),
            where("type", "==", "Referral")
          );
          const txnSnap = await getDocs(txnQuery);
          if (!txnSnap.empty) {
            setExistingReferralTxnId(txnSnap.docs[0].id);
            console.log("Existing referral txn ID:", txnSnap.docs[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
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
        setError("Error loading investment plans");
      }
    };

    fetchPlans();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };

    // Set planAmount based on selected plan name
    if (name === "investmentPlanName") {
      if (value === "Economy") {
        updatedFormData.planAmount = 500000;
      } else if (value === "Premium") {
        updatedFormData.planAmount = 2000000;
      }
    }
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
      updatedFormData[name] = value.toUpperCase();

      // setFormData({
      //   ...formData,
      //   [name]: value.toUpperCase(),
      // });
    } else if (name === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      // setFormData({
      // ...formData,
      // [name]: numericValue,
      //});
      updatedFormData[name] = numericValue;
    } else {
      updatedFormData[name] = value;
      // This is the original line that was commented out
      //setFormData({
      //  ...formData,
      // [name]: value,
      //});
    }
    setFormData(updatedFormData);
  };

  // Referral selection handler (same as AddMember)
  const handleReferralSelect = (user) => {
    setFormData((prev) => ({
      ...prev,
      referralId: user.id,
      referrerName: user.displayName,
      referrerBdaId: user.bdaId,
    }));
    setReferralChanged(true); // Set flag when referral is changed
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userRef = doc(db, "users", userId);
      const updateData = {
        ...formData,
        updatedAt: new Date(),
      };

      await updateDoc(userRef, updateData);

      // Prepare referral transaction data
      if (referralChanged) {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const currentUid = currentUser ? currentUser.uid : "Unknown";
        const referrerDoc = await getDoc(doc(db, "users", formData.referralId));
        if (referrerDoc.exists()) {
          const referrerData = referrerDoc.data();

          if (referrerData) {
            const plan = plans.find(
              (p) => p.planName === referrerData.investmentPlanName
            );
            const referralPercentage =
              plan && plan.referralPercentage
                ? Number(plan.referralPercentage)
                : 0;
            const referralBonus =
              (referralPercentage * formData.planAmount) / 100;
            const referralTxnData = {
              userId: formData.referrerBdaId,
              referralBonusAmount: referralBonus,
              referredUserId: userId,
              referralId: formData.referralId,
              referrerName: formData.referrerName,
              referrerBdaId: formData.referrerBdaId,
              referredUserPlan: formData.investmentPlanName,
              referredUserAmount: formData.planAmount,
              referralPercentage: referralPercentage,
              type: "Referral",
              amount: referralBonus,
              status: "Pending",
              timestamp: new Date(),
              description: `Referral bonus for referring ${
                formData.displayName || ""
              }`,
              updatedBy: currentUid,
              updatedAt: serverTimestamp(),
            };

            if (existingReferralTxnId) {
              // UPDATE existing referral transaction
              await updateFirestoreDoc(
                doc(db, "transactions", existingReferralTxnId),
                referralTxnData
              );
            } else {
              // CREATE new referral transaction
              await addDoc(collection(db, "transactions"), {
                ...referralTxnData,
                createdAt: serverTimestamp(),
                createdBy: currentUid,
              });
            }
          }
        }
      }
      setShowSuccessPopup(true);

      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate("/admin/newmember");
      }, 2000);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    navigate("/admin/newmember");
  };
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="add-member-container">
      {isSubmitting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Saving changes...</p>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <i className="fas fa-check-circle"></i>
            <div>
              <h3>Success!</h3>
              <p>Profile updated successfully.</p>
            </div>
          </div>
        </div>
      )}

      <div className="form-header">
        <h2>Edit Member Profile</h2>
        <Link to="/admin/newmember" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Members List
        </Link>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile data...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <form onSubmit={handleSubmit} className="create-user-form">
          {/* Personal Information Section */}
          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="displayName">Full Name *</label>
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
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="number"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  maxLength="10"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth *</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="form-section">
            <h3 className="section-title">Address Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="city">City *</label>
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
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select State</option>
                  {indianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group-full">
              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <textarea
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  required
                />
              </div>
            </div>
          </div>

          {/* Identification Section */}
          <div className="form-section">
            <h3 className="section-title">Identification Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="memberPanCard">PAN Card Number *</label>
                <input
                  type="text"
                  id="memberPanCard"
                  name="memberPanCard"
                  value={formData.memberPanCard}
                  onChange={handleInputChange}
                  maxLength={10}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="memberAadharCard">Aadhar Card Number *</label>
                <input
                  type="number"
                  id="memberAadharCard"
                  name="memberAadharCard"
                  value={formData.memberAadharCard}
                  onChange={handleInputChange}
                  maxLength={12}
                  required
                />
              </div>
            </div>
          </div>

          {/* Nominee Information */}
          <div className="form-section">
            <h3 className="section-title">Nominee Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nomineeName">Nominee Name *</label>
                <input
                  type="text"
                  id="nomineeName"
                  name="nomineeName"
                  value={formData.nomineeName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="nomineeRelation">
                  Relationship with Nominee *
                </label>
                <select
                  id="nomineeRelation"
                  name="nomineeRelation"
                  value={formData.nomineeRelation}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Relationship</option>
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
                  Nominee Aadhar Card Number
                </label>
                <input
                  type="number"
                  id="nomineeAadharCard"
                  name="nomineeAadharCard"
                  maxLength={12}
                  value={formData.nomineeAadharCard}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="form-section">
            <h3 className="section-title">Bank Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="accountNo">Account Number *</label>
                <input
                  type="number"
                  id="accountNo"
                  name="accountNo"
                  value={formData.accountNo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="bankName">Bank Name *</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code *</label>
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="branchName">Branch Name *</label>
                <input
                  type="text"
                  id="branchName"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Investment Details */}
          <div className="form-section">
            <h3 className="section-title">Investment Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="investmentPlanName">Investment Plan *</label>
                <select
                  id="investmentPlanName"
                  name="investmentPlanName"
                  value={formData.investmentPlanName}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.planName}>
                      {plan.planName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paymentMode">Payment Mode *</label>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Online">Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="investmentDate">Investment Start Date *</label>
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
          </div>

          {/* Referral Information */}
          <div className="form-section">
            <h3 className="section-title">Referral Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Referral ID</label>
                <UserSearchSelect
                  onUserSelect={handleReferralSelect}
                  initialValue={formData.referralId}
                />
              </div>
              <div className="form-group">
                <label htmlFor="referrerName">Referrer Name</label>
                <input
                  type="text"
                  id="referrerName"
                  name="referrerName"
                  value={formData.referrerName}
                  onChange={handleInputChange}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="referrerBdaId">Referrer BDA ID</label>
                <input
                  type="text"
                  id="referrerBdaId"
                  name="referrerBdaId"
                  value={formData.referrerBdaId}
                  onChange={handleInputChange}
                  readOnly
                  className="readonly-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bdaId">BDA ID</label>
                <input
                  type="text"
                  id="bdaId"
                  name="bdaId"
                  value={formData.bdaId}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="form-section">
            <h3 className="section-title">Additional Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={cancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EditProfile;
