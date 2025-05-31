const admin = require('firebase-admin');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        code: err.code,
        status: err.status
    });

    // Handle Firebase Auth errors
    if (err instanceof admin.auth.AuthError) {
        return res.status(401).json({
            error: 'Authentication Error',
            message: 'Invalid authentication credentials'
        });
    }

    // Handle Firebase Admin errors
    if (err instanceof admin.FirebaseError) {
        return res.status(500).json({
            error: 'Firebase Error',
            message: err.message,
            code: err.code
        });
    }

    // Handle validation errors (from express-validator)
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.array()
        });
    }

    // Default error response
    const statusCode = err.status || 500;
    const errorResponse = {
        error: err.name || 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    if (err.details) {
        errorResponse.details = err.details;
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;