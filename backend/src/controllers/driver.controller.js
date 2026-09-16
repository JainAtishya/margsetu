const DriverService = require('../services/driver.service');

// The Controller's ONLY job is to handle HTTP Requests and Responses.
// It extracts data from 'req', passes it to the Service, and sends 'res'.
class DriverController {
    
    static async login(req, res) {
        try {
            const { phone, password } = req.body;

            if (!phone || !password) {
                return res.status(400).json({ error: 'Phone and password are required' });
            }

            // Call the business logic layer
            const result = await DriverService.login(phone, password);

            // Send successful response
            return res.status(200).json({
                message: 'Login successful',
                data: result
            });

        } catch (error) {
            // Handle specific business logic errors
            if (error.message === 'INVALID_CREDENTIALS') {
                return res.status(401).json({ error: 'Invalid phone number or password' });
            }
            if (error.message === 'ACCOUNT_DISABLED') {
                return res.status(403).json({ error: 'Account is disabled. Contact operator.' });
            }
            
            console.error('[ERROR] Login Controller:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async refresh(req, res) {
        try {
            const { refresh_token } = req.body;

            if (!refresh_token) {
                return res.status(400).json({ error: 'Refresh token is required' });
            }

            // Call the rotation/trap logic
            const newTokens = await DriverService.refreshSession(refresh_token);

            return res.status(200).json({
                message: 'Token refreshed successfully',
                data: newTokens
            });

        } catch (error) {
            if (error.message === 'SECURITY_BREACH_DETECTED_PLEASE_LOGIN_AGAIN') {
                return res.status(403).json({ error: 'Security breach detected. Please log in again.' });
            }
            if (['TOKEN_NOT_FOUND', 'TOKEN_REVOKED', 'TOKEN_EXPIRED'].includes(error.message)) {
                return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
            }

            console.error('[ERROR] Refresh Controller:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = DriverController;
