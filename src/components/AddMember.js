import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../components/AppStyles.css";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth

const AddMember = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [investmentPlan, setInvestmentPlan] = useState("");
  const [referralId, setReferralId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // To disable button during submission
  const navigate = useNavigate();
  const db = getFirestore(); // Get Firestore instance
  const { user: adminUser } = useAuth(); // Get the current admin user
  //const adminAuth = getAuth(); // Store the admin's auth instance
  const auth = getAuth();
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null); // Add state for current user
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^\d{10}$/;
    return re.test(phone);
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch the user's data from Firestore to get the role
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setCurrentUser({ ...userDocSnap.data(), uid: user.uid });
        } else {
          setCurrentUser({ uid: user.uid, role: "unknown" }); //handle
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe(); // Cleanup the listener
  }, [auth, db]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors("");
    setIsSubmitting(true); // Disable the button
    const newErrors = {};

    // Validation checks
    if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const secondaryAuth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        "Complex&890"
      ); // Use a default password
      const { user } = userCredential;
      const uid = user.uid;

      // 2. Store additional user data in Firestore
      const userRef = doc(db, "users", uid); // Use user.uid as document ID
      await setDoc(userRef, {
        uid, // Store the UID
        name,
        email,
        phone,
        address,
        investmentPlan,
        referralId: referralId || null, // Store referralId or null if empty
        role: "user", // Set default role
        createdBy: adminUser.uid,
        createdAt: new Date().toISOString(),
      });

      console.log("User added successfully with UID:", uid);
      // Optionally, show a success message to the user
      navigate("/admin"); // Redirect to admin home or a success page
    } catch (err) {
      setErrors(err.message);
      console.error("Error adding member:", err);
    } finally {
      setIsSubmitting(false); // Re-enable the button
    }
  };

  return (
    <div className="add-member-container">
      <div className="form-header">
        <h2>New Member</h2>
        <Link to="/admin" className="btn btn-secondary back-to-dashboard">
          Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="member-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone:</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength="10"
              placeholder="10 digit number"
              required
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="investmentPlan">Investment Plan:</label>
            <select
              id="investmentPlan"
              name="investmentPlan"
              value={investmentPlan}
              onChange={(e) => setInvestmentPlan(e.target.value)}
              required
            >
              <option value="">Select a plan</option>
              <option value="plan-A-5">Plan A - 5 Lacs</option>
              <option value="plan-A-20">Plan A - 20 Lacs</option>
            </select>
          </div>

          <div className="form-group span-full">
            <label htmlFor="address">Address:</label>
            <textarea
              id="address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="referralId">Referral ID:</label>
            <input
              type="text"
              id="referralId"
              name="referralId"
              value={referralId}
              onChange={(e) => setReferralId(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMember;
