require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const userRoutes = require('./api/users');
const testRoutes = require('./api/routes/test');
const errorHandler = require('./api/middleware/errorHandler');

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

// Initialize Firebase Admin only if environment variables are present
const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID && 
    process.env.FIREBASE_PRIVATE_KEY && 
    process.env.FIREBASE_CLIENT_EMAIL;

// Initialize Firebase Admin only if it hasn't been initialized and config is present
let firebaseApp;
if (hasFirebaseConfig) {
    try {
        firebaseApp = admin.app();
    } catch (error) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        });
    }
    console.log('Firebase initialized successfully');
} else {
    console.log('Firebase configuration not found, running in test mode');
}

// Middleware setup
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Debug middleware
app.use((req, res, next) => {
    console.log('📨 Incoming request:', {
        method: req.method,
        url: req.url,
        path: req.path
    });
    next();
});

// Basic test routes
app.get('/', (req, res) => {
    console.log('🏠 Root endpoint hit');
    res.json({ 
        message: 'API is running',
        endpoints: {
            test: [
                { method: 'GET', path: '/api/hello', description: 'Get hello world message' },
                { method: 'GET', path: '/api/hello/:name', description: 'Get personalized hello message' }
            ],
            users: [
                { method: 'GET', path: '/api/users', description: 'List all users (admin only)' },
                { method: 'POST', path: '/api/users', description: 'Create new user (admin only)' },
                { method: 'GET', path: '/api/users/:userId', description: 'Get user by ID' },
                { method: 'PUT', path: '/api/users/:userId', description: 'Update user' },
                { method: 'DELETE', path: '/api/users/:userId', description: 'Delete user (admin only)' }
            ],
            plans: [
                { method: 'GET', path: '/api/plans', description: 'Get investment plans (admin only)' }
            ]
        }
    });
});

// Routes
app.use('/api', testRoutes);    // Test routes first
app.use('/api', userRoutes);    // User routes

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

// Error handling middleware (should be last)
app.use(errorHandler);

// Error handlers
// Global error handler
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Handle specific error types
    if (err.name === 'FirebaseAuthError') {
        return res.status(401).json({
            error: 'Authentication error',
            details: err.message
        });
    }

    if (err.name === 'FirebaseError') {
        return res.status(400).json({
            error: 'Firebase operation failed',
            details: err.message
        });
    }

    // Default error response
    res.status(err.status || 500).json({ 
        error: 'An error occurred while processing your request',
        details: err.message,
        path: req.path
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('\n🚀 Server is running!');
    console.log(`📡 API URL: http://localhost:${PORT}`);
    console.log('👋 Try these test endpoints:');
    console.log(`   GET http://localhost:${PORT}/api/hello`);
    console.log(`   GET http://localhost:${PORT}/api/hello/YourName`);
    console.log('\nPress Ctrl+C to stop the server\n');
});
