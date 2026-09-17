const TripService = require('../services/trip.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class SmsController {
    
    static handleIncoming = asyncHandler(async (req, res) => {
        const { from, message } = req.body;

        if (!message) {
            throw new ApiError(400, 'Message body is required');
        }

        const parts = message.split('|');
        const prefix = parts[0];

        if (prefix === 'MSLOC') {
            if (parts.length !== 5) {
                throw new ApiError(400, 'Invalid MSLOC format');
            }

            const phone = parts[1];
            const lat = parseFloat(parts[2]);
            const lon = parseFloat(parts[3]);
            const timestamp = parts[4];

            const result = await TripService.submitLocationByPhone(phone, lat, lon, timestamp);
            const msg = result.duplicate ? 'Duplicate SMS ignored' : 'Processed offline Driver Location';
            return res.status(200).json(new ApiResponse(200, result, msg));
        } 
        
        throw new ApiError(400, 'Unknown SMS format');
    });
}

module.exports = SmsController;
