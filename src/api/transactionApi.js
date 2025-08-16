import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  query,
  where,
  updateDoc,
  arrayUnion,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";

// Improved data structure for asset purchases
const createAssetPurchaseStructure = (transactionData, paymentBranch) => {
  const assetPurchase = {
    // Core asset information
    assetId: transactionData.assetId,
    assetType: transactionData.assetType,
    projectName: transactionData.projectName,
    type: "assetPurchase",

    // User information
    userId: transactionData.userId,
    userDisplayName: transactionData.userDisplayName,
    referralId: transactionData.propertyDetails?.referralId,

    // Property details
    propertyDetails: {
      plotNumber: transactionData.propertyDetails?.plotNumber,
      area: transactionData.propertyDetails?.area,
      direction: transactionData.propertyDetails?.direction,
      location: transactionData.propertyDetails?.location || "",
      additionalCharges:
        transactionData.propertyDetails?.additionalCharges || 0,
    },

    // Financial summary
    pricing: {
      totalPrice: transactionData.pricing.totalPrice,
      pricePerSqFt: transactionData.pricing.pricePerSqFt,
      discountPercentage: transactionData.pricing.discountPercentage,
      totalDiscountAmount: transactionData.pricing.totalDiscountAmount,
    },

    // Payment tracking
    paymentSummary: {
      totalAmount: transactionData.pricing.totalPrice,
      paidAmount: paymentBranch.amount,
      remainingAmount:
        transactionData.pricing.totalPrice - paymentBranch.amount,
      totalCommissionEarned:
        (paymentBranch.amount * transactionData.pricing.discountPercentage) /
        100,
      remainingCommission:
        transactionData.pricing.totalDiscountAmount -
        (paymentBranch.amount * transactionData.pricing.discountPercentage) /
          100,
    },

    // Payment history
    paymentHistory: [paymentBranch],

    // Status and metadata
    status:
      paymentBranch.amount >= transactionData.pricing.totalPrice
        ? "FULLY_PAID"
        : "PARTIALLY_PAID",
    createdAt: transactionData.createdAt,
    updatedAt: transactionData.updatedAt,

    // Non-member details if applicable
    ...(transactionData.nonMemberDetails && {
      nonMemberDetails: transactionData.nonMemberDetails,
    }),
  };

  return assetPurchase;
};

// Create transaction record for commission tracking
const createCommissionTransaction = (assetPurchase, payment, assetRefId) => {
  const commissionAmount =
    (payment.amount * assetPurchase.pricing.discountPercentage) / 100;

  return {
    type: "commission",
    referenceType: "assetPurchase",
    referenceId: assetPurchase.assetId,
    assetTransactionReference: assetRefId,
    amount: commissionAmount,
    userId: assetPurchase.userId,
    userDisplayName: assetPurchase.userDisplayName,
    projectName: assetPurchase.projectName,
    assetType: assetPurchase.assetType,
    discountPercentage: assetPurchase.pricing.discountPercentage,
    paymentAmount: payment.amount,
    paymentReference: payment.id,
    description: `Commission for payment on ${assetPurchase.projectName} - ${assetPurchase.assetType}`,
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Improved create transaction function
export const createTransaction = async (transactionData, paymentBranch) => {
  try {
    const timestamp = new Date();
    const dataWithTimestamp = {
      ...transactionData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (transactionData.type === "assetPurchase") {
      // Use Firestore transaction for atomicity
      return await runTransaction(db, async (transaction) => {
        // Create asset purchase record
        const assetPurchaseData = createAssetPurchaseStructure(
          dataWithTimestamp,
          paymentBranch
        );
        const assetPurchaseRef = doc(collection(db, "assetPurchases"));
        transaction.set(assetPurchaseRef, assetPurchaseData);

        // Create commission transaction
        const commissionData = createCommissionTransaction(
          assetPurchaseData,
          paymentBranch,
          assetPurchaseRef.id
        );
        const commissionRef = doc(collection(db, "transactions"));
        transaction.set(commissionRef, commissionData);

        return assetPurchaseRef.id;
      });
    } else {
      // For other transaction types
      const docRef = await addDoc(
        collection(db, "transactions"),
        dataWithTimestamp
      );
      return docRef.id;
    }
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

// Get asset purchase with payment details
export const getAssetPurchaseById = async (assetId) => {
  try {
    const assetRef = doc(db, "assetPurchases", assetId);
    const assetSnap = await getDoc(assetRef);

    if (assetSnap.exists()) {
      return { id: assetSnap.id, ...assetSnap.data() };
    }

    throw new Error("Asset purchase not found");
  } catch (error) {
    console.error("Error fetching asset purchase:", error);
    throw error;
  }
};

// Add payment to existing asset purchase
export const addPaymentToAsset = async (assetId, paymentData) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // Get current asset purchase data
      const assetRef = doc(db, "assetPurchases", assetId);
      const assetDoc = await transaction.get(assetRef);

      if (!assetDoc.exists()) {
        throw new Error("Asset purchase not found");
      }

      const assetData = assetDoc.data();
      const currentPaid = assetData.paymentSummary.paidAmount;
      const newPaidAmount = currentPaid + paymentData.amount;
      const remainingAmount =
        assetData.paymentSummary.totalAmount - newPaidAmount;

      // Calculate new commission
      const paymentCommission =
        (paymentData.amount * assetData.pricing.discountPercentage) / 100;
      const newTotalCommission =
        assetData.paymentSummary.totalCommissionEarned + paymentCommission;
      const remainingCommission =
        assetData.pricing.totalDiscountAmount - newTotalCommission;

      // Determine new status
      let newStatus = "PARTIALLY_PAID";
      if (newPaidAmount >= assetData.paymentSummary.totalAmount) {
        newStatus = "FULLY_PAID";
      }

      // Update asset purchase
      const updatedPaymentSummary = {
        ...assetData.paymentSummary,
        paidAmount: newPaidAmount,
        remainingAmount: remainingAmount,
        totalCommissionEarned: newTotalCommission,
        remainingCommission: remainingCommission,
      };

      transaction.update(assetRef, {
        paymentSummary: updatedPaymentSummary,
        paymentHistory: arrayUnion(paymentData),
        status: newStatus,
        updatedAt: new Date(),
      });

      // Create commission transaction
      const commissionData = createCommissionTransaction(
        assetData,
        paymentData,
        assetId
      );
      const commissionRef = doc(collection(db, "transactions"));
      transaction.set(commissionRef, commissionData);

      return {
        success: true,
        newPaidAmount,
        remainingAmount,
        commission: paymentCommission,
        status: newStatus,
      };
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

// Get transaction by ID (now checks asset purchases first, then transactions)
export const getTransactionById = async (transactionId) => {
  try {
    // First check if it's an asset purchase
    const assetPurchase = await getAssetPurchaseById(transactionId);
    if (assetPurchase) {
      return assetPurchase;
    }
  } catch (error) {
    // Continue to check transactions collection
  }

  try {
    // Check transactions collection
    const transactionRef = doc(db, "transactions", transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (transactionSnap.exists()) {
      return { id: transactionSnap.id, ...transactionSnap.data() };
    }

    throw new Error("Transaction not found");
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

// Get commission transactions for a user
export const getUserCommissions = async (userId, filters = {}) => {
  try {
    let q = query(
      collection(db, "transactions"),
      where("type", "==", "commission"),
      where("userId", "==", userId)
    );

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching user commissions:", error);
    throw error;
  }
};

// Get all asset purchases for a user
export const getUserAssetPurchases = async (userId) => {
  try {
    const q = query(
      collection(db, "assetPurchases"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching user asset purchases:", error);
    throw error;
  }
};

// Update asset purchase details (non-payment related)
export const updateAssetPurchase = async (assetId, updateData) => {
  try {
    const assetRef = doc(db, "assetPurchases", assetId);

    const updatedData = {
      ...updateData,
      updatedAt: new Date(),
    };

    await updateDoc(assetRef, updatedData);
    return true;
  } catch (error) {
    console.error("Error updating asset purchase:", error);
    throw error;
  }
};

// Delete payment from asset purchase
export const deletePaymentFromAsset = async (assetId, paymentId) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // Get current asset purchase data
      const assetRef = doc(db, "assetPurchases", assetId);
      const assetDoc = await transaction.get(assetRef);

      if (!assetDoc.exists()) {
        throw new Error("Asset purchase not found");
      }

      const assetData = assetDoc.data();
      const paymentHistory = assetData.paymentHistory || [];
      const paymentToDelete = paymentHistory.find((p) => p.id === paymentId);

      if (!paymentToDelete) {
        throw new Error("Payment not found");
      }

      // Update payment history
      const updatedPaymentHistory = paymentHistory.filter(
        (p) => p.id !== paymentId
      );

      // Recalculate totals
      const newPaidAmount = updatedPaymentHistory.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      const remainingAmount =
        assetData.paymentSummary.totalAmount - newPaidAmount;

      // Recalculate commission
      const newTotalCommission =
        (newPaidAmount * assetData.pricing.discountPercentage) / 100;
      const remainingCommission =
        assetData.pricing.totalDiscountAmount - newTotalCommission;

      // Determine new status
      let newStatus = "PARTIALLY_PAID";
      if (newPaidAmount <= 0) {
        newStatus = "PARTIALLY_PAID"; // Keep as partially paid even with 0, since there was a booking
      } else if (newPaidAmount >= assetData.paymentSummary.totalAmount) {
        newStatus = "FULLY_PAID";
      }

      // Update asset purchase
      const updatedPaymentSummary = {
        ...assetData.paymentSummary,
        paidAmount: newPaidAmount,
        remainingAmount: remainingAmount,
        totalCommissionEarned: newTotalCommission,
        remainingCommission: remainingCommission,
      };

      transaction.update(assetRef, {
        paymentSummary: updatedPaymentSummary,
        paymentHistory: updatedPaymentHistory,
        status: newStatus,
        updatedAt: new Date(),
      });

      // Find and delete the related commission transaction
      const commissionQuery = query(
        collection(db, "transactions"),
        where("type", "==", "commission"),
        where("paymentReference", "==", paymentId)
      );

      const commissionSnapshot = await getDocs(commissionQuery);
      commissionSnapshot.forEach((doc) => {
        transaction.delete(doc.ref);
      });

      return {
        success: true,
        newPaidAmount,
        remainingAmount,
        status: newStatus,
      };
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw error;
  }
};
export const getAssetPurchaseId = async (refID) => {
  try {
    const transactionDoc = doc(db, "transactions", refID);
    const docSnap = await getDoc(transactionDoc);

    if (!docSnap.exists()) {
      throw new Error("Transaction not found");
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error fetching asset purchase ID:", error);
    throw error;
  }
};
