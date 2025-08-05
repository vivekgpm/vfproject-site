import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AppStyles.css';

const EditTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    paymentAmount: '',
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

        const transactionRef = doc(db, 'transactions', id);
        const transactionSnap = await getDoc(transactionRef);
        
        if (transactionSnap.exists()) {
          const data = transactionSnap.data();
          console.log('Fetched transaction:', data);
          setTransaction(data);
          setFormData({
            paymentAmount: '',
            paymentDate: new Date().toISOString().split('T')[0], // Default to today
            remarks: ''
          });
        } else {
          console.error('Transaction not found with ID:', id);
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

  const calculateAmounts = (transaction) => {
    const totalAmount = transaction.totalAmount || transaction.amount || 0;
    const paidAmount = transaction.paidAmount || 0;
    const remainingAmount = totalAmount - paidAmount;
    return { totalAmount, paidAmount, remainingAmount };
  };

  const getTransactionStatus = (totalAmount, paidAmount) => {
    if (paidAmount === 0) return 'PENDING';
    if (paidAmount >= totalAmount) return 'FULLY_PAID';
    return 'PARTIALLY_PAID';
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        setError('Please login to add payment');
        return;
      }

      const paymentAmount = parseFloat(formData.paymentAmount);
      if (!paymentAmount || paymentAmount <= 0) {
        setError('Please enter a valid payment amount');
        return;
      }

      const { totalAmount, paidAmount, remainingAmount } = calculateAmounts(transaction);

      if (paymentAmount > remainingAmount) {
        setError(`Payment amount cannot exceed remaining amount: ₹${remainingAmount.toLocaleString()}`);
        return;
      }

      const transactionRef = doc(db, 'transactions', id);
      
      // Verify the document exists before updating
      const transactionSnap = await getDoc(transactionRef);
      if (!transactionSnap.exists()) {
        setError('Transaction not found');
        return;
      }

      // Create new payment object
      const newPayment = {
        id: `payment_${Date.now()}`,
        amount: paymentAmount,
        paymentDate: formData.paymentDate,
        remarks: formData.remarks,
        createdAt: new Date(),
        createdBy: user.uid
      };

      const newPaidAmount = paidAmount + paymentAmount;
      const newRemainingAmount = totalAmount - newPaidAmount;
      const newStatus = getTransactionStatus(totalAmount, newPaidAmount);

      // Update transaction with new payment
      await updateDoc(transactionRef, {
        totalAmount: totalAmount, // Ensure totalAmount is set
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paymentHistory: arrayUnion(newPayment),
        updatedAt: new Date(),
        updatedBy: user.uid
      });
      
      setSuccess(true);
      
      // Refresh transaction data
      const updatedSnap = await getDoc(transactionRef);
      if (updatedSnap.exists()) {
        setTransaction(updatedSnap.data());
      }

      // Reset form
      setFormData({
        paymentAmount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: ''
      });
      navigate('/admin/');
    } catch (err) {
      console.error('Error adding payment:', err);
      setError('Error adding payment: ' + err.message);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const transactionRef = doc(db, 'transactions', id);
      const transactionSnap = await getDoc(transactionRef);
      
      if (!transactionSnap.exists()) {
        setError('Transaction not found');
        return;
      }

      const data = transactionSnap.data();
      const paymentHistory = data.paymentHistory || [];
      const paymentToDelete = paymentHistory.find(p => p.id === paymentId);
      
      if (!paymentToDelete) {
        setError('Payment not found');
        return;
      }

      // Remove payment from history
      const updatedPaymentHistory = paymentHistory.filter(p => p.id !== paymentId);
      
      // Recalculate amounts
      const totalAmount = data.totalAmount || data.amount || 0;
      const newPaidAmount = updatedPaymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
      const newRemainingAmount = totalAmount - newPaidAmount;
      const newStatus = getTransactionStatus(totalAmount, newPaidAmount);

      await updateDoc(transactionRef, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        paymentHistory: updatedPaymentHistory,
        updatedAt: new Date(),
        updatedBy: user.uid
      });

      // Refresh transaction data
      const updatedSnap = await getDoc(transactionRef);
      if (updatedSnap.exists()) {
        setTransaction(updatedSnap.data());
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Error deleting payment: ' + err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!transaction) return <div>Transaction not found</div>;

  const { totalAmount, paidAmount, remainingAmount } = calculateAmounts(transaction);
  const paymentHistory = transaction.paymentHistory || [];

  return (
    <div className="edit-transaction-container">
      <div className="edit-transaction-header">
        <h2>Edit Transaction - Payment Management</h2>
        <Link to="/admin" className="back-link">Back to Admin Home</Link>
      </div>

      {success && (
        <div className="success-message">
          Payment updated successfully!
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
              <span className="label">Total Amount:</span>
              <span className="value">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Paid Amount:</span>
              <span className="value" style={{color: paidAmount > 0 ? '#4CAF50' : '#666'}}>
                ₹{paidAmount.toLocaleString()}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Remaining Amount:</span>
              <span className="value" style={{color: remainingAmount > 0 ? '#f44336' : '#4CAF50'}}>
                ₹{remainingAmount.toLocaleString()}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className={`value status-${transaction.status?.toLowerCase()}`}>
                {transaction.status || 'PENDING'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Created Date:</span>
              <span className="value">
                {transaction.createdAt?.toDate().toLocaleDateString() || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="payment-history-section">
          <h3>Payment History ({paymentHistory.length} payments)</h3>
          {paymentHistory.length > 0 ? (
            <div className="payment-history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, index) => (
                    <tr key={payment.id || index}>
                      <td>{payment.paymentDate}</td>
                      <td>₹{payment.amount.toLocaleString()}</td>
                      <td>{payment.remarks || '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleDeletePayment(payment.id)}
                          className="delete-payment-btn"
                          title="Delete Payment"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No payments recorded yet.</p>
          )}
        </div>

        {/* Add Payment Form */}
        {remainingAmount > 0 && (
          <form onSubmit={handleAddPayment} className="add-payment-form">
            <h3>Add New Payment</h3>
            
            <div className="form-group">
              <label htmlFor="paymentAmount">Payment Amount:</label>
              <input
                type="number"
                id="paymentAmount"
                value={formData.paymentAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                min="0"
                max={remainingAmount}
                step="100"
                required
              />
              <small>Maximum: ₹{remainingAmount.toLocaleString()}</small>
            </div>

            <div className="form-group">
              <label htmlFor="paymentDate">Payment Date:</label>
              <input
                type="date"
                id="paymentDate"
                value={formData.paymentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="remarks">Remarks:</label>
              <textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows="3"
                placeholder="Payment details, method, etc."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button">
                Add Payment
              </button>
            </div>
          </form>
        )}

        {remainingAmount === 0 && (
          <div className="fully-paid-message">
            <h3>✅ Transaction Fully Paid</h3>
            <p>This transaction has been fully paid. No further payments needed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTransaction;