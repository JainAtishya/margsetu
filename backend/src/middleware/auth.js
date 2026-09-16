const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

// This function acts as a gatekeeper for protected routes
const verifyToken = (req, res, next) => {
    try {
        // 1. Get the Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // 2. Extract the actual token string (remove "Bearer ")
        const token = authHeader.split(' ')[1];

        // 3. Verify the token signature and expiration
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Attach the decoded driver data (id, operator_id) to the request object
        // This allows our Controllers to know EXACTLY which driver is making the request
        req.driver = decoded;

        // 5. Pass control to the next function (the Controller)
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please refresh your session.' });
        }
        
        // If the signature doesn't match or the token is malformed
        console.error('[SECURITY] Invalid JWT token attempt:', error.message);
        return res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = { verifyToken };
