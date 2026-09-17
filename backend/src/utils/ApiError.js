class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        // Captures the stack trace for debugging (useful in development)
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;
