import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "./AppStyles.css";

const UpdateAssetPurchase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const asset = location.state?.asset;

  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!asset) {
    return <div>No asset data found. Please go back and try again.</div>;
  }

  const calculateRemainingPayment = (currentPayment) => {
    const totalPrice = asset.pricing?.totalPrice || 0;
    const currentRemainingPayment =
      asset.pricing?.remainingPayment || totalPrice;
    return Math.max(0, currentRemainingPayment - currentPayment);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payment = parseFloat(paymentAmount);
    const remainingPayment =
      asset.pricing?.remainingPayment || asset.pricing?.totalPrice || 0;

    if (payment <= 0) {
      setError("Payment amount must be greater than 0");
      setLoading(false);
      return;
    }

    if (payment > remainingPayment) {
      setError("Payment amount cannot exceed remaining payment");
      setLoading(false);
      return;
    }

    try {
      // Create transaction record
      const transactionData = {
        userId: asset.userId,
        userDisplayName: asset.userDisplayName,
        amount: (payment * asset.discountPercentage) / 100,
        createdAt: new Date(),
        projectName: asset.projectName,
        assetType: asset.assetType,
        assetId: asset.assetId,
        bookingId: asset.id,
        type: "Asset Purchase Payment",
        status: "Approved",
        discountPercentage: asset.discountPercentage || 0,
      };

      await addDoc(collection(db, "transactions"), transactionData);      // Calculate new remaining discount
      const discountOnCurrentPayment = (payment * asset.discountPercentage) / 100;
      const currentRemainingDiscount = asset.pricing?.remainingDiscount || asset.pricing?.totalDiscountAmount || 0;
      const newRemainingDiscount = Math.max(0, currentRemainingDiscount - discountOnCurrentPayment);
      
      // Update asset purchase record with both remaining payment and discount
      const newRemainingPayment = calculateRemainingPayment(payment);
      const assetRef = doc(db, "assetPurchases", asset.id);
      await updateDoc(assetRef, {
        "pricing.remainingPayment": newRemainingPayment,
        "pricing.remainingDiscount": newRemainingDiscount,
        status: newRemainingPayment === 0 ? "Paid" : "Partially Paid",
      });

      navigate("/admin/manage-asset-transactions", {
        state: { message: "Payment recorded successfully" },
      });
    } catch (error) {
      console.error("Error updating payment:", error);
      setError("Failed to process payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Update Payment for Asset Purchase</h2>
      <div className="asset-details">
        <p>
          <strong>Member:</strong> {asset.userDisplayName}
        </p>
        <p>
          <strong>Asset ID:</strong> {asset.assetId}
        </p>
        <p>
          <strong>Total Price:</strong> ₹
          {asset.pricing?.totalPrice?.toLocaleString("en-IN")}
        </p>        <p>
          <strong>Remaining Payment:</strong> ₹
          {asset.pricing?.remainingPayment?.toLocaleString("en-IN")}
        </p>
        <p>
          <strong>Discount Percentage: </strong>
          {asset.discountPercentage}%
        </p>
        <p>
          <strong>Total Discount Amount:</strong> ₹
          {asset.pricing?.totalDiscountAmount?.toLocaleString("en-IN")}
        </p>
        <p>
          <strong>Remaining Discount:</strong> ₹
          {asset.pricing?.remainingDiscount?.toLocaleString("en-IN")}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="paymentAmount">Payment Amount (₹)</label>
          <input
            type="number"
            id="paymentAmount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            max={asset.pricing?.remainingPayment.toLocaleString("en-IN")}
            required
            className="form-control"
          />
        </div>
        <div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Processing..." : "Submit Payment"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/admin/manage-asset-transactions")}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateAssetPurchase;
