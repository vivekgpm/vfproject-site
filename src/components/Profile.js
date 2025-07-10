import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getDisplayNameFromUid } from "../utils/getDisplayNameFromUid";
import "../styles/AppStyles.css"; // Import your CSS styles

const Profile = () => {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [referredNames, setReferredNames] = useState({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) return;

        // Fetch user details first
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          setError("User profile not found");
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUserDetails(userData);

        // Only fetch transactions after we have user data
        const transactionsRef = collection(db, "transactions");
        const q = query(
          transactionsRef,
          where("userId", "==", userData.bdaId) // Use bdaId from user data
        );
        const querySnapshot = await getDocs(q);

        const transactionsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

         // Sort transactions by updatedAt in descending order
        const sortedTransactions = transactionsList.sort((a, b) => {
          const dateA =
            a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0);
          const dateB =
            b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0);
          return dateB - dateA;
        });

        setTransactions(sortedTransactions); // Calculate lifetime earnings and paid amount
        // Fetch referred user display names if needed
        const referredIds = sortedTransactions
          .map((t) => t.referredUserId)
          .filter((id) => !!id);
        const namesMap = {};
        for (const refId of referredIds) {
          try {
            const dp = await getDisplayNameFromUid(refId);
            if (dp) {
              namesMap[refId] = dp;
            }
          } catch {
            namesMap[refId] = "";
          }
        }
        setReferredNames(namesMap);
        const totalEarnings = transactionsList.reduce((sum, transaction) => {
          return sum + (transaction.amount || 0);
        }, 0);

        // Calculate paid amount (sum of transactions with payment date)
        const paidAmount = transactionsList.reduce((sum, transaction) => {
          return transaction.paymentDate
            ? sum + (transaction.amount || 0)
            : sum;
        }, 0);

        setLifetimeEarnings(totalEarnings);
        setPaidAmount(paidAmount);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-title">
          <h1>Investment Statement</h1>
          <p className="statement-date">
            As of {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="investment-highlights">
        <div className="highlight-card investment-plan">
          <div className="highlight-header">
            <h3>Investmented Amount</h3>
          </div>
          <div className="highlight-content">
            <span className="highlight-value">
              {userDetails?.investmentPlan
                ? `${userDetails.investmentPlan}`
                : `${
                    userDetails.planAmount.toLocaleString("en-IN") || "Not set"
                  }`}
            </span>
          </div>
        </div>
        <div className="highlight-card lifetime-earnings">
          <div className="highlight-header">
            <h3>Total Earnings</h3>
          </div>
          <div className="highlight-content">
            <span className="highlight-value">
              ₹{lifetimeEarnings.toLocaleString("en-IN")}
            </span>
          </div>
        </div>{" "}
        <div className="highlight-card lifetime-earnings">
          <div className="highlight-header">
            <h3>Paid Amount</h3>
          </div>
          <div className="highlight-content">
            <span className="highlight-value">
              ₹{paidAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      <div className="user-info-card">
        <div className="user-info-header">
          <h3>Account Information</h3>
        </div>
        <div className="user-info-content">
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">
              {userDetails?.displayName || "Not set"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Plan:</span>
            <span className="info-value">
              {userDetails?.investmentPlanName || "Not set"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">
              {userDetails?.email || "Not set"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone:</span>
            <span className="info-value">
              {userDetails?.phone || "Not set"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">ID:</span>
            <span className="info-value">
              {userDetails?.bdaId || "Not set"}
            </span>
          </div>
        </div>
      </div>

      <div className="transactions-section">
        <h2>Transaction History</h2>
        {transactions.length > 0 ? (
          <div className="transactions-list">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Payment Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      {transaction.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td>{transaction.type}</td>
                    <td>₹{transaction.amount?.toLocaleString()}</td>
                    <td>{transaction.paymentDate}</td>
                    <td>
                      {" "}
                      {transaction.referredUserId &&
                      referredNames[transaction.referredUserId]
                        ? ` - ${referredNames[transaction.referredUserId]}`
                        : ""}
                      {transaction.remarks ? ` - ${transaction.remarks}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-transactions">No transactions found</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
