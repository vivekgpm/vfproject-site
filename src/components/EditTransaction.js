import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../components/AppStyles.css';

const EditTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    paymentDate: '',
    remarks: ''
  });

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        if (!user) {
          setError('Please login to access this page');
          return;
        }

        // Get the transaction document
        const transactionRef = doc(db, 'transactions', id);
        const transactionSnap = await getDoc(transactionRef);
        
        if (transactionSnap.exists()) {
          const data = transactionSnap.data();
          console.log('Fetched transaction:', data); // Debug log
          setTransaction(data);
          setFormData({
            paymentDate: data.paymentDate || '',
            remarks: data.remarks || ''
          });
        } else {
          console.error('Transaction not found with ID:', id); // Debug log
          setError('Transaction not found');
        }
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError('Error fetching transaction: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        setError('Please login to update transaction');
        return;
      }

      const transactionRef = doc(db, 'transactions', id);
      
      // Verify the document exists before updating
      const transactionSnap = await getDoc(transactionRef);
      if (!transactionSnap.exists()) {
        setError('Transaction not found');
        return;
      }

      await updateDoc(transactionRef, {
        paymentDate: formData.paymentDate,
        remarks: formData.remarks,
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      setSuccess(true);
      
      // Wait for 2 seconds before redirecting
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError('Error updating transaction: ' + err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!transaction) return <div>Transaction not found</div>;

  return (
    <div className="edit-transaction-container">
      <div className="edit-transaction-header">
        <h2>Edit Transaction</h2>
        <Link to="/admin" className="back-link">Back to Admin Home</Link>
      </div>

      {success && (
        <div className="success-message">
          Transaction updated successfully! Redirecting to admin page...
        </div>
      )}

      <div className="transaction-details">
        <div className="info-section">
          <h3>Transaction Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Member Name:</span>
              <span className="value">{transaction.userDisplayName || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Project:</span>
              <span className="value">{transaction.projectName || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Amount:</span>
              <span className="value">₹{transaction.pricing?.discount?.toLocaleString() || '0'}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">{transaction.status || 'Pending'}</span>
            </div>
            <div className="info-item">
              <span className="label">Created Date:</span>
              <span className="value">
                {transaction.createdAt?.toDate().toLocaleDateString() || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="paymentDate">Payment Date:</label>
            <input
              type="date"
              id="paymentDate"
              value={formData.paymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="remarks">Remarks:</label>
            <textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={success}>
              {success ? 'Updating...' : 'Update Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransaction; 