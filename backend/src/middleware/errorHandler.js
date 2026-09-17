const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    let error = err;

    // If the error thrown is a native Node error (not our custom ApiError), 
    // we wrap it so it still matches our standard format
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode ? error.statusCode : 500;
        const message = error.message || "Internal Server Error";
        error = new ApiError(statusCode, message, error?.errors || []);
    }

    // Send the standardized JSON error response
    return res.status(error.statusCode).json({
        success: error.success,
        message: error.message,
        errors: error.errors
    });
};

module.exports = errorHandler;
