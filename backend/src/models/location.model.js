const pool = require('../db/pool');

class LocationModel {
    
    // Inserts a new GPS ping. 
    // Uses ON CONFLICT DO NOTHING to silently ignore exact duplicates from SMS retries.
    static async addUpdate(tripId, latitude, longitude, gpsTimestamp, source) {
        const query = `
            INSERT INTO location_updates (trip_id, latitude, longitude, gps_timestamp, source)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (trip_id, gps_timestamp) DO NOTHING
            RETURNING id, latitude, longitude, gps_timestamp, source, received_at;
        `;
        const result = await pool.query(query, [tripId, latitude, longitude, gpsTimestamp, source]);
        
        // If result.rows[0] is undefined, it means Postgres caught a duplicate and ignored it
        return result.rows[0]; 
    }

    // Fetches the absolute latest GPS ping for a specific trip.
    // Uses the idx_latest_location composite index to run in O(log N) time instantly.
    static async getLatestLocationForTrip(tripId) {
        const query = `
            SELECT latitude, longitude, gps_timestamp, received_at, source
            FROM location_updates
            WHERE trip_id = $1
            ORDER BY gps_timestamp DESC
            LIMIT 1;
        `;
        const result = await pool.query(query, [tripId]);
        return result.rows[0];
    }
}

module.exports = LocationModel;
