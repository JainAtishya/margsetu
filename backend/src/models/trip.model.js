const pool = require('../db/pool');

class TripModel {
    
    // Finds a PENDING or ACTIVE trip for a specific driver for today's date
    static async findTodayTripForDriver(driverId) {
        const query = `
            SELECT t.id as trip_id, t.status, t.scheduled_date, 
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
            LIMIT 1;
        `;
        const result = await pool.query(query, [phone]);
        return result.rows[0];
    }

    // Fetches all buses scheduled or currently driving on a specific route today
    static async findTripsByRouteToday(routeId) {
        const query = `
            SELECT t.id as trip_id, t.status, t.scheduled_date,
                   b.registration_number as bus_number,
                   d.name as driver_name
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            JOIN drivers d ON t.driver_id = d.id
            WHERE t.route_id = $1 
              AND t.scheduled_date = CURRENT_DATE
            ORDER BY 
               CASE status 
                 WHEN 'ACTIVE' THEN 1 
                 WHEN 'PENDING' THEN 2 
                 ELSE 3 
               END;
        `;
        const result = await pool.query(query, [routeId]);
        return result.rows;
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

    static async endTrip(tripId, driverId) {
        const result = await pool.query(
            `UPDATE trips SET status = 'COMPLETED' WHERE id = $1 AND driver_id = $2 RETURNING *`,
            [tripId, driverId]
        );
        return result.rows[0];
    }

    static async getTripDetailsById(tripId, driverId) {
        const result = await pool.query(`
            SELECT 
                t.id as trip_id, t.status, t.scheduled_date,
                b.id as bus_id, b.registration_number as bus_reg, b.capacity as bus_cap,
                r.id as route_id, r.route_code, r.name as route_name
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            JOIN routes r ON t.route_id = r.id
            WHERE t.id = $1 AND t.driver_id = $2
        `, [tripId, driverId]);
        
        if (result.rows.length === 0) return null;
        
        const row = result.rows[0];
        return {
            tripId: row.trip_id,
            status: row.status,
            scheduledDate: row.scheduled_date,
            bus: {
                id: row.bus_id,
                registrationNumber: row.bus_reg,
                capacity: row.bus_cap
            },
            route: {
                id: row.route_id,
                code: row.route_code,
                name: row.route_name
            }
        };
    }
}

module.exports = TripModel;
