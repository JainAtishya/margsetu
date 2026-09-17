const TripService = require('../services/trip.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class TripController {
    
    static getTrip = asyncHandler(async (req, res) => {
        const trip = await TripService.getAssignedTrip(req.driver.id);
        return res.status(200).json(new ApiResponse(200, trip, 'Assigned trip fetched successfully'));
    });

    static startTrip = asyncHandler(async (req, res) => {
        const trip = await TripService.startTrip(req.params.id, req.driver.id);
        return res.status(200).json(new ApiResponse(200, trip, 'Trip started successfully'));
    });

    static submitLocation = asyncHandler(async (req, res) => {
        const tripId = req.params.id;
        const { latitude, longitude, gps_timestamp } = req.body;

        if (!latitude || !longitude || !gps_timestamp) {
            throw new ApiError(400, 'Missing latitude, longitude, or gps_timestamp');
        }

        const result = await TripService.submitLocation(tripId, req.driver.id, latitude, longitude, gps_timestamp);
        
        const message = result.duplicate ? 'Duplicate location ignored' : 'Location updated successfully';
        return res.status(200).json(new ApiResponse(200, result, message));
    });

    static endTrip = asyncHandler(async (req, res) => {
        const trip = await TripService.endTrip(req.params.id, req.driver.id);
        return res.status(200).json(new ApiResponse(200, trip, 'Trip ended successfully'));
    });
}

module.exports = TripController;
