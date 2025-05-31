const { validationResult } = require('express-validator');

/**
 * Middleware to validate request against provided validation rules
 * @param {Array} validations - Array of express-validator validation rules
 * @returns {Function} Express middleware function
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Execute all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Format validation errors
        const formattedErrors = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));

        return res.status(400).json({
            error: 'Validation Error',
            details: formattedErrors
        });
    };
};

module.exports = validate;