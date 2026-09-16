const pool = require('../db/pool');

// The Model layer ONLY contains raw SQL queries. No business logic.
class DriverModel {
    
    // Finds a driver and their operator_id so we can verify passwords
    static async findByPhone(phone) {
        const result = await pool.query(
            'SELECT id, operator_id, name, password_hash, is_active FROM drivers WHERE phone = $1',
            [phone]
        );
        return result.rows[0];
    }

    // --- REFRESH TOKEN QUERIES ---

    // Saves a newly generated refresh token to the database
    static async saveRefreshToken(token, driverId, familyId, expiresAt) {
        await pool.query(
            `INSERT INTO refresh_tokens (token, driver_id, family_id, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [token, driverId, familyId, expiresAt]
        );
    }

    // Looks up a refresh token when the app tries to use it
    static async getRefreshToken(token) {
        const result = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1',
            [token]
        );
        return result.rows[0];
    }

    // Flips the boolean so we know this token has been safely consumed
    static async markAsUsed(token) {
        await pool.query(
            'UPDATE refresh_tokens SET is_used = TRUE WHERE token = $1',
            [token]
        );
    }

    // THE NUCLEAR OPTION: If reuse is detected, kill every token in the family
    static async revokeTokenFamily(familyId) {
        await pool.query(
            'UPDATE refresh_tokens SET is_revoked = TRUE WHERE family_id = $1',
            [familyId]
        );
    }
}

module.exports = DriverModel;
