// controllers/userController.js
const admin = require('firebase-admin');

// ...rest of your server code
// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    project_id:"vvpvf-9f894",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  }),
  databaseURL: `https://vvpvf-9f894-default-rtdb.firebaseio.com`
});

// Create a new user
exports.createNewUser = async (req, res) => {
  try {
    // 1. Verify the requestor is an admin
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid token.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;
    
    // Check if requestor is admin (from Firestore)
    const requestorDoc = await admin.firestore()
      .collection('users')
      .doc(requestorUid)
      .get();
    
    if (!requestorDoc.exists || requestorDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can create users.' });
    }
    
    // 2. Extract new user details from request
    const { email, password, displayName, role = 'user', referralId, investmentPlan } = req.body;
    
    if (!email || !password || !investmentPlan) {
      return res.status(400).json({ error: 'Email, password, and investment plan are required.' });
    }
    
    // 3. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0]
    });
    
    // 4. Get investment plan details
    const planDoc = await admin.firestore()
      .collection('planMaster')
      .doc(investmentPlan)
      .get();
    
    if (!planDoc.exists) {
      throw new Error('Invalid investment plan');
    }
    
    const planData = planDoc.data();
    
    // 5. Handle referral bonus if referrer exists
    
    
    // 6. Store user data in Firestore (excluding password)
    const userData = {
      email,
      displayName: displayName || email.split('@')[0],
      role,
      investmentPlan,
      planAmount: planData.amount,
      referralId: referralId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: requestorUid
    };
    
    // Create user document and referral transaction in a batch
    const batch = admin.firestore().batch();
    
    // Add user document
    const userRef = admin.firestore().collection('users').doc(userRecord.uid);
    batch.set(userRef, userData);
    
   
    
    // Commit the batch
    await batch.commit();
    console.log('Batch committed successfully');
    
    // 7. Set custom claims (for role-based auth)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    
    return res.status(201).json({ 
      message: 'User created successfully',
      uid: userRecord.uid
    });
    
  } catch (error) {
    console.error('Error creating new user:', error);
    return res.status(500).json({ error: error.message });
  }
};

// List all users (admin only)
exports.listUsers = async (req, res) => {
  try {
    // Verify admin status
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid token.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;
    
    const requestorDoc = await admin.firestore()
      .collection('users')
      .doc(requestorUid)
      .get();
    
    if (!requestorDoc.exists || requestorDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can list users.' });
    }
    
    // List users from Firestore
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .get();
    
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ users });
    
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get user by ID (admin or self)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid token.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;
    
    // Check if requestor is admin or self
    if (requestorUid !== userId) {
      const requestorDoc = await admin.firestore()
        .collection('users')
        .doc(requestorUid)
        .get();
      
      if (!requestorDoc.exists || requestorDoc.data().role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. You can only access your own data.' });
      }
    }
    
    // Get user data
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    return res.status(200).json({
      uid: userId,
      ...userDoc.data()
    });
    
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Update user (admin or self)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid token.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;
    
    // Get user data to update
    const { displayName, photoURL, role } = req.body;
    const updateData = {};
    
    // Check if requestor is admin or self
    const isAdmin = await isUserAdmin(requestorUid);
    const isSelf = requestorUid === userId;
    
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Unauthorized. You can only update your own data.' });
    }
    
    // Non-admins cannot update their own role
    if (!isAdmin && role) {
      return res.status(403).json({ error: 'Unauthorized. You cannot update your role.' });
    }
    
    // Prevent downgrading admin role
    if (role && role !== 'admin') {
      const targetUser = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
        
      if (targetUser.exists && targetUser.data().role === 'admin') {
        return res.status(403).json({ error: 'Cannot downgrade admin role.' });
      }
    }
    
    // Build update object
    if (displayName) updateData.displayName = displayName;
    if (photoURL) updateData.photoURL = photoURL;
    if (role && isAdmin) updateData.role = role;
    
    // Update user in Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: requestorUid
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
      message: 'User updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify admin status
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid token.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;
    
    // Check if requestor is admin
    const isAdmin = await isUserAdmin(requestorUid);
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Unauthorized. Only admins can delete users.' });
    }
    
    // Prevent deleting another admin
    const targetUser = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
      
    if (targetUser.exists && targetUser.data().role === 'admin' && userId !== requestorUid) {
      return res.status(403).json({ error: 'Cannot delete another admin user.' });
    }
    
    // Delete user from Auth
    await admin.auth().deleteUser(userId);
    
    // Delete user from Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .delete();
    
    return res.status(200).json({ 
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Helper function to check if user is admin
async function isUserAdmin(uid) {
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(uid)
    .get();
  
  return userDoc.exists && userDoc.data().role === 'admin';
}

// Get plan data from planMaster collection
exports.getPlanData = async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. Missing or invalid token.' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestorUid = decodedToken.uid;
    
    // Check if requestor is admin
    const requestorDoc = await admin.firestore()
      .collection('users')
      .doc(requestorUid)
      .get();
    
    if (!requestorDoc.exists || requestorDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can access plan data.' });
    }
    
    // Get plan data from Firestore
    const plansSnapshot = await admin.firestore()
      .collection('planMaster')
      .get();
    
    const plans = [];
    plansSnapshot.forEach(doc => {
      plans.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ plans });
    
  } catch (error) {
    console.error('Error getting plan data:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get referral bonus amount based on referrer's plan
exports.calculateReferralBonus = async (referrerId, investmentAmount) => {
  try {
    // Get referrer's data
    const referrerDoc = await admin.firestore()
      .collection('users')
      .doc(referrerId)
      .get();
    
    if (!referrerDoc.exists) {
      throw new Error('Referrer not found');
    }
    
    const referrerData = referrerDoc.data();
    
    // Get referrer's plan data
    const planDoc = await admin.firestore()
      .collection('planMaster')
      .doc(referrerData.investmentPlan)
      .get();
    
    if (!planDoc.exists) {
      throw new Error('Referrer plan not found');
    }
    
    const planData = planDoc.data();
    
    // Calculate referral bonus
    const referralBonus = (investmentAmount * planData.referralPercentage) / 100;
    
    return {
      amount: referralBonus,
      planId: referrerData.investmentPlan,
      planName: planData.planName,
      referralPercentage: planData.referralPercentage
    };
    
  } catch (error) {
    console.error('Error calculating referral bonus:', error);
    throw error;
  }
};