const TripModel = require('../models/trip.model');
const LocationModel = require('../models/location.model');
const pool = require('../db/pool');

class TripService {
    
    static async getAssignedTrip(driverId) {
        const trip = await TripModel.findTodayTripForDriver(driverId);
        if (!trip) {
            throw new Error('NO_TRIP_ASSIGNED');
        }
        return trip;
    }

    static async startTrip(tripId, driverId) {
        try {
            const updatedTrip = await TripModel.updateTripStatus(tripId, driverId, 'ACTIVE');
            if (!updatedTrip) throw new Error('TRIP_NOT_FOUND_OR_UNAUTHORIZED');
            return updatedTrip;
        } catch (error) {
            if (error.code === '23505') {
                if (error.constraint === 'one_active_trip_per_bus') throw new Error('BUS_ALREADY_ACTIVE');
                if (error.constraint === 'one_active_trip_per_driver') throw new Error('DRIVER_ALREADY_ACTIVE');
            }
            throw error;
        }
    }

    static async submitLocation(tripId, driverId, latitude, longitude, gpsTimestamp, source = 'INTERNET') {
        // Step 1: Security Check. Is this trip ACTIVE and does it belong to this driver?
        const check = await pool.query(
            'SELECT id FROM trips WHERE id = $1 AND driver_id = $2 AND status = $3',
            [tripId, driverId, 'ACTIVE']
        );
        
        if (check.rows.length === 0) {
            throw new Error('UNAUTHORIZED_OR_NOT_ACTIVE');
        }

        // Step 2: Save the ping
        const newLocation = await LocationModel.addUpdate(tripId, latitude, longitude, gpsTimestamp, source);

        if (!newLocation) {
            // Postgres ignored it because it was a duplicate ping!
            return { duplicate: true, message: 'Duplicate location ignored' };
        }

        // TODO: In the next phase, we will trigger Socket.IO here to push to passengers!
        
        return { duplicate: false, location: newLocation };
    }

    // A helper for the SMS Gateway. It translates a phone number into a tripId and driverId,
    // then pipes the data right back into the main submitLocation function.
    static async submitLocationByPhone(phone, latitude, longitude, gpsTimestamp) {
        const activeTrip = await TripModel.findActiveTripByDriverPhone(phone);
        
        if (!activeTrip) {
            throw new Error('NO_ACTIVE_TRIP_FOR_PHONE');
        }

        return this.submitLocation(
            activeTrip.trip_id, 
            activeTrip.driver_id, 
            latitude, 
            longitude, 
            gpsTimestamp, 
            'SMS' // Hardcoded source so we can audit offline rates!
        );
    }

    static async endTrip(tripId, driverId) {
        const updatedTrip = await TripModel.updateTripStatus(tripId, driverId, 'COMPLETED');
        if (!updatedTrip) throw new Error('TRIP_NOT_FOUND_OR_UNAUTHORIZED');
        return updatedTrip;
    }
}

module.exports = TripService;
