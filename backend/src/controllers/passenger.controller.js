const RouteModel = require('../models/route.model');
const TripModel = require('../models/trip.model');
const LocationModel = require('../models/location.model');

class PassengerController {
    
    // Step 1: Show the passenger all available routes
    static async getAllRoutes(req, res) {
        try {
            const routes = await RouteModel.getAllRoutes();
            return res.status(200).json({ data: routes });
        } catch (error) {
            console.error('[ERROR] PassengerController.getAllRoutes:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Step 2: Show the passenger all buses for their selected route
    static async getBusesForRoute(req, res) {
        try {
            const routeId = req.params.routeId;
            const trips = await TripModel.findTripsByRouteToday(routeId);
            return res.status(200).json({ data: trips });
        } catch (error) {
            console.error('[ERROR] PassengerController.getBusesForRoute:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Step 3: Fetch the initial live location of a specific active bus
    static async getTripLocation(req, res) {
        try {
            const tripId = req.params.tripId;
            const location = await LocationModel.getLatestLocationForTrip(tripId);
            
            if (!location) {
                return res.status(404).json({ error: 'No location data found for this trip yet' });
            }

            return res.status(200).json({ data: location });
        } catch (error) {
            console.error('[ERROR] PassengerController.getTripLocation:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = PassengerController;
