// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const userRoutes = require('./routes/users'); // We'll create this file

const app = express();

// Initialize Firebase Admin with environment variables
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Initialize Firebase Admin only if it hasn't been initialized
let firebaseApp;
try {
  firebaseApp = admin.app();
} catch (error) {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Admin token generation endpoint
app.post('/api/admin-token', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Check if user is admin
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({ error: 'User is not an admin' });
    }

    // Create custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.json({ token: customToken });
  } catch (error) {
    console.error('Error generating admin token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user endpoint
app.post('/api/create-user', async (req, res) => {
  try {
    const { email, password, userData, transactionData } = req.body;
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
      return res.status(403).json({ error: 'Unauthorized. Only admins can create users.' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: userData.displayName
    });

    // Add UID to userData
    userData.uid = userRecord.uid;
    userData.createdAt = admin.firestore.FieldValue.serverTimestamp();

    // Create user document in Firestore
    await admin.firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set(userData);

    // Add user ID to transaction data
    transactionData.userId = userRecord.uid;
    transactionData.createdAt = admin.firestore.FieldValue.serverTimestamp();

    // Create transaction document
    await admin.firestore()
      .collection('transactions')
      .add(transactionData);

    res.status(201).json({ 
      message: 'User created successfully',
      uid: userRecord.uid
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Routes
app.use('/api', userRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Firebase Admin API is running');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});