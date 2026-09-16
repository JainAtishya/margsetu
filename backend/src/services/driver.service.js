const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const DriverModel = require('../models/driver.model');

// In production, these should be in .env. We'll use defaults for now if they are missing.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';
const ACCESS_TOKEN_TTL = '15m'; // 15 minutes
const REFRESH_TOKEN_TTL_DAYS = 7; // 7 days

class DriverService {
    
    // 1. INITIAL LOGIN
    static async login(phone, password) {
        // Step 1: Check if driver exists
        const driver = await DriverModel.findByPhone(phone);
        if (!driver) {
            throw new Error('INVALID_CREDENTIALS');
        }

        if (!driver.is_active) {
            throw new Error('ACCOUNT_DISABLED');
        }

        // Step 2: Verify password
        const isMatch = await bcrypt.compare(password, driver.password_hash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }

        // Step 3: Generate the 15-minute Access Token (JWT)
        const accessToken = jwt.sign(
            { id: driver.id, operator_id: driver.operator_id },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        // Step 4: Generate the 7-day Refresh Token (UUID) and a new Family ID
        const refreshToken = crypto.randomUUID();
        const familyId = crypto.randomUUID();
        
        // Calculate exact expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

        // Save to DB
        await DriverModel.saveRefreshToken(refreshToken, driver.id, familyId, expiresAt);

        return {
            driver: { id: driver.id, name: driver.name },
            tokens: { access_token: accessToken, refresh_token: refreshToken }
        };
    }

    // 2. REFRESH TOKEN ROTATION (The Security Trap)
    static async refreshSession(oldTokenStr) {
        // Step 1: Find the token in the database
        const tokenRecord = await DriverModel.getRefreshToken(oldTokenStr);
        if (!tokenRecord) {
            throw new Error('TOKEN_NOT_FOUND');
        }

        // Step 2: Check for explicit revocation (admin kicked them out)
        if (tokenRecord.is_revoked) {
            throw new Error('TOKEN_REVOKED');
        }

        // Step 3: THE REUSE TRAP (Someone is trying to use a token we already rotated!)
        if (tokenRecord.is_used) {
            console.warn(`[SECURITY] Token reuse detected for family ${tokenRecord.family_id}`);
            // Nuclear option: kill the entire session family
            await DriverModel.revokeTokenFamily(tokenRecord.family_id);
            throw new Error('SECURITY_BREACH_DETECTED_PLEASE_LOGIN_AGAIN');
        }

        // Step 4: Check if it expired naturally
        if (new Date() > new Date(tokenRecord.expires_at)) {
            throw new Error('TOKEN_EXPIRED');
        }

        // --- AT THIS POINT, THE OLD TOKEN IS VALID. WE PROCEED WITH ROTATION ---

        // 1. Mark the old token as used
        await DriverModel.markAsUsed(oldTokenStr);

        // 2. Generate a fresh Access Token
        // (We need the driver data again to put it in the new JWT)
        const driver = await pool.query('SELECT id, operator_id FROM drivers WHERE id = $1', [tokenRecord.driver_id]); // Quick inline fetch
        
        const newAccessToken = jwt.sign(
            { id: tokenRecord.driver_id, operator_id: driver.rows[0].operator_id },
            JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        // 3. Generate a NEW Refresh Token, but KEEP the same family_id
        const newRefreshToken = crypto.randomUUID();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

        await DriverModel.saveRefreshToken(newRefreshToken, tokenRecord.driver_id, tokenRecord.family_id, newExpiresAt);

        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken
        };
    }
}

// Small hack: bringing pool in just for the quick driver lookup during refresh
const pool = require('../db/pool'); 

module.exports = DriverService;
