const TripModel = require('../models/trip.model');
const LocationModel = require('../models/location.model');
const pool = require('../db/pool');
const { getIo } = require('../socket');
const ApiError = require('../utils/ApiError');

class TripService {
    
    static async getAssignedTrip(driverId) {
        const trip = await TripModel.findTodayTripForDriver(driverId);
        if (!trip) throw new ApiError(404, 'You have no assigned trips for today.');
        return trip;
    }

    static async startTrip(tripId, driverId) {
        try {
            const updatedTrip = await TripModel.updateTripStatus(tripId, driverId, 'ACTIVE');
            if (!updatedTrip) throw new ApiError(404, 'Trip not found or you are not authorized to start it.');
            return updatedTrip;
        } catch (error) {
            if (error.code === '23505') {
                if (error.constraint === 'one_active_trip_per_bus') throw new ApiError(409, 'This bus is already currently active on another trip.');
                if (error.constraint === 'one_active_trip_per_driver') throw new ApiError(409, 'You already have an active trip. Please end it first.');
            }
            throw error; // Let the global handler catch other DB errors
        }
    }

    static async submitLocation(tripId, driverId, latitude, longitude, gpsTimestamp, source = 'INTERNET') {
        const check = await pool.query(
            'SELECT id FROM trips WHERE id = $1 AND driver_id = $2 AND status = $3',
            [tripId, driverId, 'ACTIVE']
        );
        
        if (check.rows.length === 0) {
            throw new ApiError(403, 'Trip is not active or you do not have permission to update it.');
        }

        const newLocation = await LocationModel.addUpdate(tripId, latitude, longitude, gpsTimestamp, source);

        if (!newLocation) {
            // It's a duplicate. We return a flag so the controller can send a nice 200 OK.
            return { duplicate: true }; 
        }

        try {
            const io = getIo();
            io.to(`trip:${tripId}`).emit('location_update', newLocation);
        } catch (socketError) {
            console.error('[WARNING] Failed to emit socket event', socketError);
        }
        
        return { duplicate: false, location: newLocation };
    }

    static async submitLocationByPhone(phone, latitude, longitude, gpsTimestamp) {
        const activeTrip = await TripModel.findActiveTripByDriverPhone(phone);
        
        if (!activeTrip) {
            throw new ApiError(404, 'No active trip found for this phone number');
        }

        return this.submitLocation(activeTrip.trip_id, activeTrip.driver_id, latitude, longitude, gpsTimestamp, 'SMS');
    }

    static async endTrip(tripId, driverId) {
        const updatedTrip = await TripModel.updateTripStatus(tripId, driverId, 'COMPLETED');
        if (!updatedTrip) throw new ApiError(404, 'Trip not found or you are not authorized to end it.');
        return updatedTrip;
    }

    static async getTripDetails(tripId, driverId) {
        const details = await TripModel.getTripDetailsById(tripId, driverId);
        if (!details) {
            throw new ApiError(404, 'Trip not found or unauthorized');
        }
        return details;
    }
}

module.exports = TripService;
