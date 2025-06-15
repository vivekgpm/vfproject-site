import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getAllPlans } from "../api/planApi";
import UserSearchSelect from "./UserSearchSelect";
import "../components/AppStyles.css";
import { indianStates, countries } from "../utils/constants";

const EXP_API_URL = process.env.REACT_APP_API_URL_3 || "http://localhost:3001";

let db;
let auth;

try {
  db = getFirestore();
  auth = getAuth();
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

const AddMember = () => {
  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    phone: "",
    address: "",
    city: "",
    state: "Karnataka",
    country: "India",
    investmentPlan: "",
    referralId: "",
    role: "user",
    password: "Complex123!",
    paymentMode: "Online",
    remarks: "",
    memberPanCard: "",
    memberAadharCard: "",
    nomineeName: "",
    nomineeRelation: "Spouse",
    nomineeAadharCard: "",
    accountNo: "",
    bankName: "",
    ifscCode: "",
    branchName: "",
    investmentDate: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [bdaId, setBdaId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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

  const generateBdaId = useCallback(async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("bdaId", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let newNumber = 1;
      if (!querySnapshot.empty) {
        const lastBdaId = querySnapshot.docs[0].data().bdaId;
        const lastNumber = parseInt(lastBdaId.replace("BDA", ""));
        newNumber = lastNumber + 1;
      }

      const newBdaId = `BDA${newNumber.toString().padStart(4, "0")}`;
      setBdaId(newBdaId);
    } catch (error) {
      console.error("Error generating BDA ID:", error);
      setErrorMessage("Error generating BDA ID");
    }
  }, []);

  useEffect(() => {
    generateBdaId();
  }, [generateBdaId]);

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

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      phone: value,
    }));
  };

  const handleReferralSelect = (user) => {
    setFormData((prev) => ({
      ...prev,
      referralId: user.bdaId || user.uid,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    if (!isAdmin) {
      setErrorMessage("You must be an admin to create users");
      setIsSubmitting(false);
      return;
    }

    try {
      const adminUid = currentUser.uid;
      const idToken = await currentUser.getIdToken(true);

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setErrorMessage(
          "This email address is already registered. Please use a different email."
        );
        return;
      }

      const selectedPlan = plans.find((p) => p.id === formData.investmentPlan);
      const planAmount = selectedPlan ? selectedPlan.amount : 0;

      const response = await fetch(`${EXP_API_URL}/api/users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          investmentPlanId: selectedPlan.id,
          investmentPlan: planAmount,
          bdaId: bdaId,
          address: formData.address,
          phone: formData.phone,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          displayName: formData.displayName,
          referralId: formData.referralId || null,
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
          userData: {
            ...formData,
            bdaId,
            investmentPlan: planAmount,
            uid: null,
            role: "user",
            memberPanCard: formData.memberPanCard,
            memberAadharCard: formData.memberAadharCard,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      const responseData = await response.json();

      if (responseData.uid && formData.referralId) {
        try {
          const referrerDoc = await getDoc(
            doc(db, "users", formData.referralId)
          );

          if (referrerDoc.exists()) {
            const referrerData = referrerDoc.data();
            const referrerPlan = plans.find(
              (p) => p.amount === referrerData.planAmount
            );

            if (referrerPlan) {
              const referralBonus =
                (planAmount * referrerPlan.referralPercentage) / 100;

              await addDoc(collection(db, "transactions"), {
                userId: referrerData.bdaId,
                type: "Referral",
                amount: referralBonus,
                referralBonusAmount: referralBonus,
                status: "PENDING",
                description: `Referral bonus for referring ${
                  formData.displayName || formData.email
                }`,
                referredUserId: responseData.uid,
                referredUserPlan: selectedPlan.planName,
                referredUserAmount: planAmount,
                referralPercentage: referrerPlan.referralPercentage,
                createdAt: serverTimestamp(),
                createdBy: adminUid,
              });
            }
          }
        } catch (error) {
          console.error("Error creating referral transaction:", error);
        }
      }

      setSuccessMessage("Member added successfully!");
      setShowSuccessPopup(true);
      setFormData({
        email: "",
        displayName: "",
        phone: "",
        address: "",
        city: "",
        state: "Karnataka",
        country: "India",
        investmentPlan: "",
        referralId: "",
        role: "user",
        password: "Complex123!",
        paymentMode: "Online",
        remarks: "",
        investmentDate: "",
        memberPanCard: "",
        memberAadharCard: "",
        nomineeName: "",
        nomineeRelation: "Spouse",
        nomineeAadharCard: "",
        accountNo: "",
        bankName: "",
        ifscCode: "",
        branchName: "",
      });

      await generateBdaId();

      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate("/admin/newmember");
      }, 3000);
    } catch (error) {
      console.error("Error adding member:", error);

      if (error.message.includes("email-already-in-use")) {
        setErrorMessage(
          "This email address is already registered. Please use a different email."
        );
      } else if (error.message.includes("invalid-email")) {
        setErrorMessage("Please enter a valid email address.");
      } else if (error.message.includes("weak-password")) {
        setErrorMessage(
          "Password is too weak. Please use a stronger password."
        );
      } else {
        setErrorMessage(
          error.message || "Error adding member. Please try again."
        );
      }
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
        <h2>New BDA Member Registration</h2>
        <Link to="/admin" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </Link>
      </div>

      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <i className="fas fa-check-circle"></i>
            <div>
              <h3>Success!</h3>
              <p>Member has been added successfully.</p>
            </div>
          </div>
        </div>
      )}

      <div className="form-container">
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <form onSubmit={handleCreateUser} className="create-user-form">
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
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
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
                <label htmlFor="investmentPlan">Investment Plan:</label>
                <select
                  id="investmentPlan"
                  name="investmentPlan"
                  value={formData.investmentPlan}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.planName}
                    </option>
                  ))}
                </select>
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
              <div className="form-group">
                <label>Referral ID:</label>
                <UserSearchSelect onUserSelect={handleReferralSelect} />
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
                  required
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
            <h3 className="section-title">Nominee & Bank Details</h3>
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
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
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
                  <i className="fas fa-spinner fa-spin"></i> Adding Member...
                </>
              ) : (
                "Add Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMember;
