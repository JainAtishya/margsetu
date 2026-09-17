const pool = require('../db/pool');

class RouteModel {
    
    // Fetches all available routes in the system for the passenger to choose from
    static async getAllRoutes() {
        const query = `
            SELECT id, route_code, name 
            FROM routes 
            ORDER BY route_code ASC;
        `;
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = RouteModel;
