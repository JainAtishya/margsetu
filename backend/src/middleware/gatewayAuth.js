const GATEWAY_SECRET = process.env.SMS_GATEWAY_SECRET || 'margsetu-gateway-secret-v1';

// This middleware only allows our physical Gateway Phone to access the SMS endpoints
const verifyGateway = (req, res, next) => {
    const apiKey = req.headers['x-gateway-secret'];

    if (!apiKey || apiKey !== GATEWAY_SECRET) {
        console.warn('[SECURITY] Unauthorized attempt to access SMS Gateway API');
        return res.status(403).json({ error: 'Forbidden. Invalid Gateway Secret.' });
    }

    next();
};

module.exports = { verifyGateway };
