// controllers/userController.js
const admin = require("firebase-admin");

// Helper function to check if user is admin
async function isUserAdmin(uid) {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();

  return userDoc.exists && userDoc.data().role === "admin";
}

// Create a new user
exports.createNewUser = async (req, res) => {
  try {
    // Log request details for debugging
    console.log("Create user request:", {
      body: req.body,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization
          ? "Bearer [REDACTED]"
          : undefined,
      },
    });

    // Validate request structure
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Invalid request body",
        details: "Request body must be a JSON object",
      });
    }

    // Verify the requestor is an admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Auth header missing or invalid");
      return res.status(401).json({
        error: "Unauthorized",
        details: "Missing or invalid authorization token",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;

    // Check if requestor is admin
    if (!(await isUserAdmin(requestorUid))) {
      return res
        .status(403)
        .json({ error: "Unauthorized. Only admins can create users." });
    }

    // 2. Extract new user details from request
    const {
      email,
      password,
      displayName,
      role = "user",
      investmentPlanId,
      bdaId,
      phone,
      address,
      city,
      state,
      country,
      paymentMode,
      remarks,
      bankName,
      branchName,
      accountNo,
      ifscCode,
      nomineeName,
      nomineeRelation,
      panCard,
      aadharCard,
    } = req.body;

    const missingFields = [];
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");
    if (!investmentPlanId) missingFields.push("investmentPlan");

    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      return res.status(400).json({
        error: "Missing required fields",
        missingFields: missingFields,
      });
    }

    // 3. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    // 4. Validate and get investment plan details
    if (
      !investmentPlanId ||
      typeof investmentPlanId !== "string" ||
      investmentPlanId.trim() === ""
    ) {
      console.error("Invalid investment plan ID:", investmentPlanId);
      return res.status(400).json({
        error: "Invalid investment plan",
        details: "Investment plan ID must be a non-empty string",
      });
    }

    let planData;
    try {
      const planDoc = await admin
        .firestore()
        .collection("planMaster")
        .doc(investmentPlanId.trim())
        .get();

      if (!planDoc.exists) {
        console.error("Investment plan not found:", investmentPlanId);
        return res.status(404).json({
          error: "Investment plan not found",
          details: `No plan exists with ID: ${investmentPlanId}`,
        });
      }

      planData = planDoc.data();
      if (!planData || !planData.amount) {
        console.error("Invalid plan data:", planData);
        return res.status(500).json({
          error: "Invalid plan configuration",
          details: "The selected plan is not properly configured",
        });
      }
    } catch (error) {
      console.error("Error fetching investment plan:", error);
      return res.status(500).json({
        error: "Failed to fetch investment plan",
        details: error.message,
      });
    }

    // 5. Store user data in Firestore
    const userData = {
      email,
      displayName: displayName || email.split("@")[0],
      role,
      bdaId,
      planAmount: planData.amount,
      phone,
      address,
      city,
      state,
      country,
      paymentMode,
      remarks,
      bankName,
      branchName,
      accountNo,
      ifscCode,
      nomineeName,
      nomineeRelation,
      panCard,
      aadharCard,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: requestorUid,
    };

    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set(userData);

    // 6. Set custom claims (for role-based auth)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    return res.status(201).json({
      message: "User created successfully",
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error("Error creating new user:", error);
    return res.status(500).json({ error: error.message });
  }
};

// List all users (admin only)
exports.listUsers = async (req, res) => {
  try {
    // Verify admin status
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing or invalid token." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if requestor is admin
    if (!(await isUserAdmin(decodedToken.uid))) {
      return res
        .status(403)
        .json({ error: "Unauthorized. Only admins can list users." });
    }

    // List users from Firestore
    const usersSnapshot = await admin.firestore().collection("users").get();

    const users = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        uid: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error listing users:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get user by ID (admin or self)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing or invalid token." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;

    // Check if requestor is admin or self
    if (requestorUid !== userId && !(await isUserAdmin(requestorUid))) {
      return res
        .status(403)
        .json({ error: "Unauthorized. You can only access your own data." });
    }

    // Get user data
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      uid: userId,
      ...userDoc.data(),
    });
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Update user (admin or self)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing or invalid token." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;

    // Get user data to update
    const { displayName, photoURL, role } = req.body;
    const updateData = {};

    // Check if requestor is admin or self
    const isAdmin = await isUserAdmin(requestorUid);
    const isSelf = requestorUid === userId;

    if (!isAdmin && !isSelf) {
      return res
        .status(403)
        .json({ error: "Unauthorized. You can only update your own data." });
    }

    // Non-admins cannot update their own role
    if (!isAdmin && role) {
      return res
        .status(403)
        .json({ error: "Unauthorized. You cannot update your role." });
    }

    // Prevent downgrading admin role
    if (role && role !== "admin") {
      const targetUser = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();

      if (targetUser.exists && targetUser.data().role === "admin") {
        return res.status(403).json({ error: "Cannot downgrade admin role." });
      }
    }

    // Build update object
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;
    if (role && isAdmin) updateData.role = role;

    // Update user in Firestore
    await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: requestorUid,
      });

    // Update Auth profile if needed
    if (displayName || photoURL) {
      const authUpdateData = {};
      if (displayName) authUpdateData.displayName = displayName;
      if (photoURL) authUpdateData.photoURL = photoURL;

      await admin.auth().updateUser(userId, authUpdateData);
    }

    // Update custom claims if role changed
    if (role && isAdmin) {
      await admin.auth().setCustomUserClaims(userId, { role });
    }

    return res.status(200).json({
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify admin status
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing or invalid token." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;

    // Check if requestor is admin
    const isAdmin = await isUserAdmin(requestorUid);

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Unauthorized. Only admins can delete users." });
    }

    // Prevent deleting another admin
    const targetUser = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();

    if (
      targetUser.exists &&
      targetUser.data().role === "admin" &&
      userId !== requestorUid
    ) {
      return res
        .status(403)
        .json({ error: "Cannot delete another admin user." });
    }

    // Delete user from Auth
    await admin.auth().deleteUser(userId);

    // Delete user from Firestore
    await admin.firestore().collection("users").doc(userId).delete();

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Get plan data
exports.getPlanData = async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing or invalid token." });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Check if requestor is admin
    if (!(await isUserAdmin(decodedToken.uid))) {
      return res
        .status(403)
        .json({ error: "Unauthorized. Only admins can access plan data." });
    }

    // Get plan data from Firestore
    const plansSnapshot = await admin
      .firestore()
      .collection("planMaster")
      .get();

    const plans = [];
    plansSnapshot.forEach((doc) => {
      plans.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({ plans });
  } catch (error) {
    console.error("Error getting plan data:", error);
    return res.status(500).json({ error: error.message });
  }
};
