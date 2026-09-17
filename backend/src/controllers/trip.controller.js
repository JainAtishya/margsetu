const TripService = require('../services/trip.service');

class TripController {
    
    static async getTrip(req, res) {
        try {
            // req.driver.id comes directly from our JWT auth middleware!
            const trip = await TripService.getAssignedTrip(req.driver.id);
            return res.status(200).json({ data: trip });
        } catch (error) {
            if (error.message === 'NO_TRIP_ASSIGNED') {
                return res.status(404).json({ error: 'You have no assigned trips for today.' });
            }
            console.error('[ERROR] Get Trip Controller:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async startTrip(req, res) {
        try {
            const tripId = req.params.id;
            const trip = await TripService.startTrip(tripId, req.driver.id);
            return res.status(200).json({ message: 'Trip started successfully', data: trip });
        } catch (error) {
            if (error.message === 'TRIP_NOT_FOUND_OR_UNAUTHORIZED') {
                return res.status(404).json({ error: 'Trip not found or you are not authorized to start it.' });
            }
            if (error.message === 'BUS_ALREADY_ACTIVE') {
                return res.status(409).json({ error: 'This bus is already currently active on another trip.' });
            }
            if (error.message === 'DRIVER_ALREADY_ACTIVE') {
                return res.status(409).json({ error: 'You already have an active trip. Please end it first.' });
            }
            console.error('[ERROR] Start Trip Controller:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async submitLocation(req, res) {
        try {
            const tripId = req.params.id;
            const { latitude, longitude, gps_timestamp } = req.body;

            if (!latitude || !longitude || !gps_timestamp) {
                return res.status(400).json({ error: 'Missing latitude, longitude, or gps_timestamp' });
            }

            const result = await TripService.submitLocation(tripId, req.driver.id, latitude, longitude, gps_timestamp);
            return res.status(200).json(result);

        } catch (error) {
            if (error.message === 'UNAUTHORIZED_OR_NOT_ACTIVE') {
                return res.status(403).json({ error: 'Trip is not active or you do not have permission to update it.' });
            }
            console.error('[ERROR] Submit Location Controller:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async endTrip(req, res) {
        try {
            const tripId = req.params.id;
            const trip = await TripService.endTrip(tripId, req.driver.id);
            return res.status(200).json({ message: 'Trip ended successfully', data: trip });
        } catch (error) {
            if (error.message === 'TRIP_NOT_FOUND_OR_UNAUTHORIZED') {
                return res.status(404).json({ error: 'Trip not found or you are not authorized to end it.' });
            }
            console.error('[ERROR] End Trip Controller:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = TripController;
