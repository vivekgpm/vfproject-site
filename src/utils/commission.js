// Additional utility functions for transaction management

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

// Get commission transactions for a specific asset purchase
export const getAssetCommissions = async (assetId) => {
  try {
    const q = query(
      collection(db, "transactions"),
      where("type", "==", "commission"),
      where("referenceId", "==", assetId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching asset commissions:", error);
    throw error;
  }
};

// Get summary statistics for a user
export const getUserSummary = async (userId) => {
  try {
    // Get all asset purchases for user
    const assetPurchases = await getUserAssetPurchases(userId);

    // Get all commissions for user
    const commissions = await getUserCommissions(userId);

    // Calculate summary
    const summary = {
      totalAssets: assetPurchases.length,
      fullyPaidAssets: assetPurchases.filter(
        (asset) => asset.status === "FULLY_PAID"
      ).length,
      partiallyPaidAssets: assetPurchases.filter(
        (asset) => asset.status === "PARTIALLY_PAID"
      ).length,
      totalInvestment: assetPurchases.reduce(
        (sum, asset) => sum + (asset.paymentSummary?.paidAmount || 0),
        0
      ),
      totalCommissionEarned: commissions.reduce(
        (sum, commission) => sum + commission.amount,
        0
      ),
      pendingCommission: commissions
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + c.amount, 0),
      paidCommission: commissions
        .filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + c.amount, 0),
    };

    return summary;
  } catch (error) {
    console.error("Error getting user summary:", error);
    throw error;
  }
};

// Get recent transactions (for admin dashboard)
export const getRecentTransactions = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    throw error;
  }
};

// Get recent asset purchases (for admin dashboard)
export const getRecentAssetPurchases = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, "assetPurchases"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching recent asset purchases:", error);
    throw error;
  }
};

// Update commission status (for when commissions are paid out)
export const updateCommissionStatus = async (
  commissionIds,
  newStatus,
  paidDate = null
) => {
  try {
    const batch = [];

    for (const commissionId of commissionIds) {
      const commissionRef = doc(db, "transactions", commissionId);
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
      };

      if (paidDate) {
        updateData.paidDate = paidDate;
      }

      batch.push(updateDoc(commissionRef, updateData));
    }

    await Promise.all(batch);
    return true;
  } catch (error) {
    console.error("Error updating commission status:", error);
    throw error;
  }
};

// Get commission summary for admin
export const getCommissionSummary = async () => {
  try {
    const q = query(
      collection(db, "transactions"),
      where("type", "==", "commission")
    );

    const snapshot = await getDocs(q);
    const commissions = snapshot.docs.map((doc) => doc.data());

    const summary = {
      totalCommissions: commissions.length,
      totalAmount: commissions.reduce((sum, c) => sum + c.amount, 0),
      pendingAmount: commissions
        .filter((c) => c.status === "PENDING")
        .reduce((sum, c) => sum + c.amount, 0),
      paidAmount: commissions
        .filter((c) => c.status === "PAID")
        .reduce((sum, c) => sum + c.amount, 0),
      pendingCount: commissions.filter((c) => c.status === "PENDING").length,
      paidCount: commissions.filter((c) => c.status === "PAID").length,
    };

    return summary;
  } catch (error) {
    console.error("Error getting commission summary:", error);
    throw error;
  }
};

// Validate payment amount against remaining amount
export const validatePaymentAmount = (assetPurchase, paymentAmount) => {
  const remainingAmount = assetPurchase.paymentSummary?.remainingAmount || 0;

  if (paymentAmount <= 0) {
    return { valid: false, error: "Payment amount must be greater than 0" };
  }

  if (paymentAmount > remainingAmount) {
    return {
      valid: false,
      error: `Payment amount cannot exceed remaining amount: ₹${remainingAmount.toLocaleString()}`,
    };
  }

  return { valid: true };
};

// Calculate what the commission would be for a payment amount
export const calculateCommission = (paymentAmount, discountPercentage) => {
  return (paymentAmount * discountPercentage) / 100;
};

// Get asset purchase status color for UI
export const getStatusColor = (status) => {
  switch (status) {
    case "FULLY_PAID":
      return "#4CAF50"; // Green
    case "PARTIALLY_PAID":
      return "#FF9800"; // Orange
    default:
      return "#757575"; // Gray
  }
};

// Format payment type for display
export const formatPaymentType = (paymentType) => {
  switch (paymentType) {
    case "booking":
      return "Booking";
    case "installment":
      return "Installment";
    default:
      return "Payment";
  }
};
