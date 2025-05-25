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

// Get API URL from environment variable or use default
const EXP_API_URL = process.env.REACT_APP_API_URL_3 || "http://localhost:3001"; // Fallback to localhost if not set

// Initialize Firebase services
let db;
let auth;

try {
  db = getFirestore();
  auth = getAuth();
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// List of Indian states
const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

// List of countries (partial list - add more as needed)
const countries = [
  "India",
  "Afghanistan",
  "Australia",
  "Bangladesh",
  "Bhutan",
  "Canada",
  "China",
  "France",
  "Germany",
  "Indonesia",
  "Japan",
  "Malaysia",
  "Maldives",
  "Nepal",
  "New Zealand",
  "Pakistan",
  "Russia",
  "Singapore",
  "Sri Lanka",
  "Thailand",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
];

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
    password: "Complex123!", // Default password
    paymentMode: "Cash", // Default payment mode
    remarks: "", // New field for remarks
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
  }, []); // Removed auth and db from dependencies since they're initialized outside
  const generateBdaId = useCallback(async () => {
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
  }, []); // Removed db from dependencies since it's initialized outside

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
      referralId: user.uid || user.id,
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
      // Store admin's current session info
      const adminUid = currentUser.uid;

      // Get fresh ID token
      const idToken = await currentUser.getIdToken(true);

      // Check if email already exists in Firestore
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

      // Make API call with proper authentication
      const response = await fetch(`${EXP_API_URL}/api/users`, {
        method: "POST",
        credentials: "include", // Important for requests with cookies
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
          userData: {
            ...formData,
            bdaId,
            investmentPlan: planAmount,
            uid: null, // Will be set by the API
            role: "user",
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create user");
      }

      const responseData = await response.json();

      // Handle referral bonus if user was created successfully and has a referrer
      if (responseData.uid && formData.referralId) {
        try {
          // Get referrer's data using UID
          const referrerDoc = await getDoc(
            doc(db, "users", formData.referralId)
          );

          if (referrerDoc.exists()) {
            const referrerData = referrerDoc.data();
            const referrerPlan = plans.find(
              (p) =>
                p.amount === referrerData.investmentPlan ||
                referrerData.planAmount
            );

            if (referrerPlan) {
              const referralBonus =
                (planAmount * referrerPlan.referralPercentage) / 100;

              // Create referral bonus transaction
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
      setShowSuccessPopup(true); // Reset form
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
        paymentMode: "Cash",
        remarks: "",
      });

      // Generate new BDA ID for next user
      await generateBdaId();

      // Close popup after 3 seconds and navigate
      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate("/admin/newmember");
      }, 3000);
    } catch (error) {
      console.error("Error adding member:", error);

      // Handle specific errors
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
            <h3>Success!</h3>
            <p>Member has been added successfully.</p>
          </div>
        </div>
      )}

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
                <label htmlFor="paymentMode">Payment Mode:</label>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="NEFT/RTGS">NEFT/RTGS</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
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
                <label htmlFor="remarks">Remarks:</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  rows="2"
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>

            {/* Column 3 */}
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

            {/* Column 4 */}
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
                <label>Referral ID:</label>
                <UserSearchSelect onUserSelect={handleReferralSelect} />
              </div>

              <div className="form-group" style={{ display: "none" }}>
                <label htmlFor="role">Role:</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled
                >
                  <option value="user">User</option>
                </select>
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
