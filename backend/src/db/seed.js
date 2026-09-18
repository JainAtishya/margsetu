const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('starting db seed...');

        // clear existing data so we can run this script multiple times without errors
        await pool.query('DELETE FROM trips');
        await pool.query('DELETE FROM route_stops');
        await pool.query('DELETE FROM stops');
        await pool.query('DELETE FROM routes');
        await pool.query('DELETE FROM buses');
        await pool.query('DELETE FROM drivers');
        await pool.query('DELETE FROM operators');

        const defaultPassword = await bcrypt.hash('admin123', 10);
        const driverPassword = await bcrypt.hash('driver123', 10);

        // 1. insert operator
        const opRes = await pool.query(
            `INSERT INTO operators (name, email, password_hash) 
             VALUES ($1, $2, $3) RETURNING id`,
            ['Rajasthan Transit', 'admin@transit.com', defaultPassword]
        );
        const operatorId = opRes.rows[0].id;

        // 2. insert driver
        const driverRes = await pool.query(
            `INSERT INTO drivers (operator_id, name, phone, password_hash) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [operatorId, 'Ramesh Kumar', '+919876543210', driverPassword]
        );
        const driverId = driverRes.rows[0].id;

        // 3. insert bus
        const busRes = await pool.query(
            `INSERT INTO buses (operator_id, registration_number, capacity) 
             VALUES ($1, $2, $3) RETURNING id`,
            [operatorId, 'RJ-14-PA-1234', 40]
        );
        const busId = busRes.rows[0].id;

        // 4. insert route
        const routeRes = await pool.query(
            `INSERT INTO routes (operator_id, route_code, name) 
             VALUES ($1, $2, $3) RETURNING id`,
            [operatorId, 'R1', 'Ajmer to Masuda via Kishangarh']
        );
        const routeId = routeRes.rows[0].id;

        // 5. insert stops
        const stop1Res = await pool.query(
            `INSERT INTO stops (operator_id, name, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id`,
            [operatorId, 'Ajmer Bus Stand', 26.4499, 74.6399]
        );
        const stop2Res = await pool.query(
            `INSERT INTO stops (operator_id, name, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id`,
            [operatorId, 'Masuda Bus Stand', 26.1011, 74.5200]
        );

        // 6. map stops to the route
        await pool.query(
            `INSERT INTO route_stops (route_id, stop_id, stop_sequence) VALUES ($1, $2, $3)`,
            [routeId, stop1Res.rows[0].id, 1]
        );
        await pool.query(
            `INSERT INTO route_stops (route_id, stop_id, stop_sequence) VALUES ($1, $2, $3)`,
            [routeId, stop2Res.rows[0].id, 2]
        );

        // 7. create a PENDING trip for today
        await pool.query(
            `INSERT INTO trips (route_id, bus_id, driver_id, scheduled_date, status) VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
            [routeId, busId, driverId, 'PENDING']
        );

        console.log('[SUCCESS] database seeded successfully');
    } catch (err) {
        console.error('[ERROR] seed failed:', err);
    } finally {
        pool.end(); // close the db connection so the script exits
    }
}

seed();
