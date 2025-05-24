import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import '../components/AppStyles.css';

const Profile = () => {
  const { user } = useAuth();
  const [userDetails, setUserDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user) return;

        // Fetch user details
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserDetails(userDoc.data());
        }

        // Fetch transactions
        const transactionsRef = collection(db, 'transactions');
        const q = query(transactionsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const transactionsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTransactions(transactionsList);

        // Calculate lifetime earnings
        const totalEarnings = transactionsList.reduce((sum, transaction) => {
          return sum + (transaction.pricing?.discount || 0);
        }, 0);
        setLifetimeEarnings(totalEarnings);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load profile data');
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
          <p className="statement-date">As of {new Date().toLocaleDateString()}</p>
        </div>
        <div className="user-info-card">
          <div className="user-info-header">
            <h3>Account Information</h3>
          </div>
          <div className="user-info-content">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{userDetails?.displayName || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{userDetails?.email || 'Not set'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone:</span>
              <span className="info-value">{userDetails?.phone || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="investment-highlights">
        <div className="highlight-card investment-plan">
          <div className="highlight-header">
            <h3>Investmented Amount</h3>
          </div>
          <div className="highlight-content">
            <span className="highlight-value">
              {userDetails?.investmentPlan ? `${userDetails.investmentPlan}` : 'Not set'}
            </span>
          </div>
        </div>
        <div className="highlight-card lifetime-earnings">
          <div className="highlight-header">
            <h3>Lifetime Earnings</h3>
          </div>
          <div className="highlight-content">
            <span className="highlight-value">₹{lifetimeEarnings.toLocaleString()}</span>
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
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.createdAt?.toDate().toLocaleDateString()}</td>
                    <td>{transaction.type}</td>
                    <td>₹{transaction.amount?.toLocaleString()}</td>
                    <td>{transaction.paymentDate}</td>
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
