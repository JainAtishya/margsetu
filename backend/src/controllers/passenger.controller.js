const RouteModel = require('../models/route.model');
const TripModel = require('../models/trip.model');
const LocationModel = require('../models/location.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class PassengerController {
    
    static getAllRoutes = asyncHandler(async (req, res) => {
        const routes = await RouteModel.getAllRoutes();
        return res.status(200).json(new ApiResponse(200, routes, 'Routes fetched successfully'));
    });

    static getBusesForRoute = asyncHandler(async (req, res) => {
        const routeId = req.params.routeId;
        const trips = await TripModel.findTripsByRouteToday(routeId);
        return res.status(200).json(new ApiResponse(200, trips, 'Buses fetched successfully'));
    });

    static getTripLocation = asyncHandler(async (req, res) => {
        const tripId = req.params.tripId;
        const location = await LocationModel.getLatestLocationForTrip(tripId);
        
        if (!location) {
            throw new ApiError(404, 'No location data found for this trip yet');
        }

        return res.status(200).json(new ApiResponse(200, location, 'Latest location fetched successfully'));
    });
}

module.exports = PassengerController;
