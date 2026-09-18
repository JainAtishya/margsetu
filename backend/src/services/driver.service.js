const DriverModel = require('../models/driver.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ApiError = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

class DriverService {
    
    static async login(phone, password) {
        const driver = await DriverModel.findByPhone(phone);
        
        if (!driver) {
            throw new ApiError(401, 'Invalid phone number or password');
        }

        if (!driver.is_active) {
            throw new ApiError(403, 'Account is disabled. Contact operator.');
        }

        const isMatch = await bcrypt.compare(password, driver.password_hash);
        if (!isMatch) {
            throw new ApiError(401, 'Invalid phone number or password');
        }

        const payload = { id: driver.id, operator_id: driver.operator_id };
        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        
        const refreshToken = crypto.randomUUID();
        const familyId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await DriverModel.saveRefreshToken(refreshToken, driver.id, familyId, expiresAt);

        return {
            driver: { id: driver.id, name: driver.name },
            tokens: { access_token: accessToken, refresh_token: refreshToken }
        };
    }

    static async saveRefreshToken(driverId, refreshToken) {
        return await DriverModel.updateRefreshToken(driverId, refreshToken);
    }

    static async logout(driverId) {
        // Nullify the refresh token in the database so it cannot be used again
        return await DriverModel.updateRefreshToken(driverId, null);
    }

    static async refreshSession(oldTokenString) {
        const tokenRecord = await DriverModel.getRefreshToken(oldTokenString);

        if (!tokenRecord) {
            throw new ApiError(401, 'Invalid or expired session. Please log in again.');
        }

        if (tokenRecord.is_revoked) {
            throw new ApiError(401, 'Session revoked. Please log in again.');
        }

        if (tokenRecord.is_used) {
            await DriverModel.revokeTokenFamily(tokenRecord.family_id);
            throw new ApiError(403, 'Security breach detected. Please log in again.');
        }

        await DriverModel.markAsUsed(tokenRecord.token);

        const driver = await DriverModel.findById(tokenRecord.driver_id);
        
        const payload = { id: driver.id, operator_id: driver.operator_id };
        const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
        
        const newRefreshToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await DriverModel.saveRefreshToken(newRefreshToken, driver.id, tokenRecord.family_id, expiresAt);

        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        };
    }
}

module.exports = DriverService;
