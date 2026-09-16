const TripModel = require('../models/trip.model');

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
            
            if (!updatedTrip) {
                // If no row was returned, either the trip doesn't exist or it doesn't belong to this driver
                throw new Error('TRIP_NOT_FOUND_OR_UNAUTHORIZED');
            }
            
            return updatedTrip;

        } catch (error) {
            // Postgres error code 23505 means "Unique Violation"
            if (error.code === '23505') {
                if (error.constraint === 'one_active_trip_per_bus') {
                    throw new Error('BUS_ALREADY_ACTIVE');
                }
                if (error.constraint === 'one_active_trip_per_driver') {
                    throw new Error('DRIVER_ALREADY_ACTIVE');
                }
            }
            throw error; // If it's a different database error, throw it up the chain
        }
    }

    static async endTrip(tripId, driverId) {
        const updatedTrip = await TripModel.updateTripStatus(tripId, driverId, 'COMPLETED');
        if (!updatedTrip) {
            throw new Error('TRIP_NOT_FOUND_OR_UNAUTHORIZED');
        }
        return updatedTrip;
    }
}

module.exports = TripService;
