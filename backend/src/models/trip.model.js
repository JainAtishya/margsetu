const pool = require('../db/pool');

class TripModel {
    
    // Finds a PENDING or ACTIVE trip for a specific driver for today's date
    static async findTodayTripForDriver(driverId) {
        const query = `
            SELECT t.id, t.status, t.scheduled_date, 
                   r.route_code, r.name as route_name, 
                   b.registration_number as bus_number
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON t.bus_id = b.id
            WHERE t.driver_id = $1 
              AND t.scheduled_date = CURRENT_DATE
              AND t.status IN ('PENDING', 'ACTIVE')
            LIMIT 1;
        `;
        const result = await pool.query(query, [driverId]);
        return result.rows[0];
    }

    // Used by the SMS Gateway to look up an active trip using only a phone number
    static async findActiveTripByDriverPhone(phone) {
        const query = `
            SELECT t.id as trip_id, t.driver_id 
            FROM trips t
            JOIN drivers d ON t.driver_id = d.id
            WHERE d.phone = $1 
              AND t.status = 'ACTIVE'
              AND t.scheduled_date = CURRENT_DATE
            LIMIT 1;
        `;
        const result = await pool.query(query, [phone]);
        return result.rows[0];
    }

    // Changes the status of the trip (e.g., to 'ACTIVE' or 'COMPLETED')
    // We include driverId in the WHERE clause so a driver can't modify someone else's trip
    static async updateTripStatus(tripId, driverId, status) {
        const query = `
            UPDATE trips 
            SET status = $1 
            WHERE id = $2 AND driver_id = $3
            RETURNING id, status;
        `;
        const result = await pool.query(query, [status, tripId, driverId]);
        return result.rows[0];
    }
}

module.exports = TripModel;
