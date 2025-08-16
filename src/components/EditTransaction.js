import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatIndianPrice } from "../utils/indianPrice";
import {
  getAssetPurchaseById,
  addPaymentToAsset,
  deletePaymentFromAsset,
} from "../api/transactionApi";
import "../styles/AppStyles.css";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

const EditTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { type } = useLocation().state || {};
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAssetPurchase, setIsAssetPurchase] = useState(false);
  const [formData, setFormData] = useState({
    paymentAmount: "",
    paymentDate: "",
    remarks: "",
  });
  const [assetPurchaseId, setAssetPurchaseId] = useState(null);

  const formatDate = (date) => {
    if (!date) return "-";
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        if (!user) {
          setError("Please login to access this page");
          return;
        }

        // Try to get as asset purchase first
        try {
          // const assetPurchaseId = await getAssetPurchaseId(id);
          //  setAssetPurchaseId(assetPurchaseId);
          if (type !== "Referral") {
            setAssetPurchaseId(id);
            const assetData = await getAssetPurchaseById(id);
            setTransaction(assetData);
            setIsAssetPurchase(true);
          } else {
            const transactionRef = doc(db, "transactions", id);
            const transactionSnap = await getDoc(transactionRef);
            if (transactionSnap.exists()) {
              const data = transactionSnap.data();
              setTransaction(data);
              setIsAssetPurchase(false);
            }
          }
        } catch (assetError) {
          // If not found in asset purchases, try transactions
          console.log(assetError);
        }

        setFormData({
          paymentAmount: "",
          paymentDate: new Date().toISOString().split("T")[0],
          remarks: "",
        });
      } catch (err) {
        console.error("Error fetching transaction:", err);
        setError("Transaction not found: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, user, type]);

  const getTransactionAmounts = (transaction) => {
    if (isAssetPurchase) {
      return {
        totalAmount: transaction.paymentSummary?.totalAmount || 0,
        paidAmount: transaction.paymentSummary?.paidAmount || 0,
        remainingAmount: transaction.paymentSummary?.remainingAmount || 0,
        totalCommission: transaction.paymentSummary?.totalCommissionEarned || 0,
        remainingCommission:
          transaction.paymentSummary?.remainingCommission || 0,
      };
    } else {
      // Legacy transaction format
      const totalAmount = transaction.totalAmount || transaction.amount || 0;
      const paidAmount = transaction.paidAmount || 0;
      return {
        totalAmount,
        paidAmount,
        remainingAmount: totalAmount - paidAmount,
        totalCommission: 0,
        remainingCommission: 0,
      };
    }
  };
  const getTransactionStatus = (totalAmount, paidAmount) => {
    if (paidAmount === 0) return "PENDING";
    if (paidAmount >= totalAmount) return "FULLY_PAID";
    return "PARTIALLY_PAID";
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      if (!user) {
        setError("Please login to add payment");
        return;
      }

      const paymentAmount = parseFloat(formData.paymentAmount);
      if (!paymentAmount || paymentAmount <= 0) {
        setError("Please enter a valid payment amount");
        return;
      }

      const { remainingAmount } = getTransactionAmounts(transaction);

      if (paymentAmount > remainingAmount) {
        setError(
          `Payment amount cannot exceed remaining amount: ₹${remainingAmount.toLocaleString()}`
        );
        return;
      }

      if (isAssetPurchase) {
        // Create new payment object
        const newPayment = {
          id: `payment_${Date.now()}`,
          amount: paymentAmount,
          paymentDate: formData.paymentDate,
          paymentType: "installment", // Add payment type
          remarks:
            formData.remarks ||
            `Regular payment for ${transaction.projectName}`,
          createdAt: new Date(),
          createdBy: user.uid,
        };
        // Add payment to asset purchase
        const result = await addPaymentToAsset(
          assetPurchaseId,
          newPayment
        );

        // Refresh asset purchase data
        const updatedAsset = await getAssetPurchaseById(assetPurchaseId);
        setTransaction(updatedAsset);

        setSuccess(
          `Payment added successfully! Commission earned: ₹${formatIndianPrice(
            result.commission
          )}`
        );
      } else {
        // Handle legacy transaction (if needed)
        //setError("Legacy transaction updates not implemented in this version");
        // Create new payment object
        const newPayment = {
          id: `payment_${Date.now()}`,
          amount: paymentAmount,
          paymentDate: formData.paymentDate,
          remarks: formData.remarks,
          createdAt: new Date(),
          createdBy: user.uid,
        };
        const transactionRef = doc(db, "transactions", id);

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
          updatedBy: user.uid,
        });

        setSuccess("Payment added successfully!");
      }

      // Reset form
      setFormData({
        paymentAmount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        remarks: "",
      });
      navigate("/admin");
    } catch (err) {
      console.error("Error adding payment:", err);
      setError("Error adding payment: " + err.message);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this payment? This will also remove the related commission."
      )
    ) {
      return;
    }

    try {
      if (isAssetPurchase) {
        await deletePaymentFromAsset(id, paymentId);

        // Refresh asset purchase data
        const updatedAsset = await getAssetPurchaseById(id);
        setTransaction(updatedAsset);

        setSuccess("Payment deleted successfully!");
      } else {
        setError("Payment deletion for legacy transactions not implemented");
      }
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError("Error deleting payment: " + err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!transaction) return <div>Transaction not found</div>;

  const {
    totalAmount,
    paidAmount,
    remainingAmount,
    totalCommission,
    remainingCommission,
  } = getTransactionAmounts(transaction);
  const paymentHistory = transaction.paymentHistory || [];

  return (
    <div className="edit-transaction-container">
      <div className="edit-transaction-header">
        <h2>
          {isAssetPurchase ? "Asset Purchase" : "Transaction"} - Payment
          Management
        </h2>
        <Link to="/admin" className="back-link">
          Back to Admin Home
        </Link>
      </div>

      {success && <div className="success-message">{success}</div>}

      <div className="transaction-details">
        <div className="info-section">
          <h3>
            {isAssetPurchase ? "Asset Purchase Details" : "Transaction Details"}
          </h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Member Name:</span>
              <span className="value">
                {transaction.userDisplayName || "N/A"}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Project:</span>
              <span className="value">{transaction.projectName || "N/A"}</span>
            </div>
            {isAssetPurchase && (
              <>
                <div className="info-item">
                  <span className="label">Asset Type:</span>
                  <span className="value">
                    {transaction.assetType || "N/A"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Plot Number:</span>
                  <span className="value">
                    {transaction.propertyDetails?.plotNumber || "N/A"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Area:</span>
                  <span className="value">
                    {transaction.propertyDetails?.area || "N/A"} sq.ft
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Price per sq.ft:</span>
                  <span className="value">
                    ₹{formatIndianPrice(transaction.pricing?.pricePerSqFt || 0)}
                  </span>
                </div>
              </>
            )}
            <div className="info-item">
              <span className="label">Total Amount:</span>
              <span className="value">₹{formatIndianPrice(totalAmount)}</span>
            </div>
            <div className="info-item">
              <span className="label">Paid Amount:</span>
              <span
                className="value"
                style={{ color: paidAmount > 0 ? "#4CAF50" : "#666" }}
              >
                ₹{formatIndianPrice(paidAmount)}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Remaining Amount:</span>
              <span
                className="value"
                style={{ color: remainingAmount > 0 ? "#f44336" : "#4CAF50" }}
              >
                ₹{formatIndianPrice(remainingAmount)}
              </span>
            </div>
            {isAssetPurchase && (
              <>
                <div className="info-item">
                  <span className="label">Total Commission Earned:</span>
                  <span className="value" style={{ color: "#4CAF50" }}>
                    ₹{formatIndianPrice(totalCommission)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Remaining Commission:</span>
                  <span className="value">
                    ₹{formatIndianPrice(remainingCommission)}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Discount Percentage:</span>
                  <span className="value">
                    {transaction.pricing?.discountPercentage || 0}%
                  </span>
                </div>
              </>
            )}
            <div className="info-item">
              <span className="label">Status:</span>
              <span
                className={`value status-${transaction.status?.toLowerCase()}`}
              >
                {transaction.status || "PENDING"}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Created Date:</span>
              <span className="value">{formatDate(transaction.createdAt)}</span>
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
                    <th>Type</th>
                    <th>Amount</th>
                    {isAssetPurchase && <th>Commission</th>}
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, index) => (
                    <tr key={payment.id || index}>
                      <td>{formatDate(payment.paymentDate)}</td>
                      <td>
                        <span
                          className={`payment-type ${
                            payment.paymentType || "unknown"
                          }`}
                        >
                          {payment.paymentType === "booking"
                            ? "Booking"
                            : payment.paymentType === "installment"
                            ? "Installment"
                            : "Payment"}
                        </span>
                      </td>
                      <td>₹{formatIndianPrice(payment.amount)}</td>
                      {isAssetPurchase && (
                        <td>
                          ₹
                          {formatIndianPrice(
                            (payment.amount *
                              (transaction.pricing?.discountPercentage || 0)) /
                              100
                          )}
                        </td>
                      )}
                      <td>{payment.remarks || "-"}</td>
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentAmount: e.target.value,
                  }))
                }
                min="0"
                max={remainingAmount}
                step="100"
                required
              />
              <small>
                Maximum: ₹{remainingAmount.toLocaleString()}
                {isAssetPurchase && (
                  <span>
                    {" "}
                    | Commission will be: ₹
                    {formatIndianPrice(
                      (parseFloat(formData.paymentAmount || 0) *
                        (transaction.pricing?.discountPercentage || 0)) /
                        100
                    )}
                  </span>
                )}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="paymentDate">Payment Date:</label>
              <input
                type="date"
                id="paymentDate"
                value={formData.paymentDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentDate: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="remarks">Remarks:</label>
              <textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
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
            <h3>✅ Asset Fully Paid</h3>
            <p>
              This asset has been fully paid. No further payments needed.
              {isAssetPurchase && (
                <span>
                  {" "}
                  Total commission earned: ₹{formatIndianPrice(totalCommission)}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditTransaction;
