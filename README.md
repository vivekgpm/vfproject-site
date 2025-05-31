# Node.js Express API with Firebase

A Node.js Express API server with Firebase Admin integration for user management and authentication.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values from your Firebase Console
   - Adjust PORT if needed (defaults to 3001)

3. Start the server:
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on port 3001 (or the port specified in the PORT environment variable).

## Available Endpoints

### User Management
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Test Routes
- `GET /api/hello` - Test endpoint
- `GET /api/hello/:name` - Personalized test endpoint

## Development

This project uses:
- Express.js for the API server
- Firebase Admin SDK for user management
- Express Validator for input validation
- CORS for cross-origin resource sharing

### Environment Variables

Required environment variables (see `.env.example`):
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account client email
- `FIREBASE_PRIVATE_KEY` - Service account private key
- `FIREBASE_PRIVATE_KEY_ID` - Service account private key ID
- `FIREBASE_CLIENT_ID` - Service account client ID
- `FIREBASE_CLIENT_CERT_URL` - Service account certificate URL
- `PORT` - Server port (defaults to 3001)
