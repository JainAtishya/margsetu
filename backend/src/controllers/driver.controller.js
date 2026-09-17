const DriverService = require('../services/driver.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class DriverController {
    
    // Notice how clean this is! No try/catch, no ugly if/else statements.
    static login = asyncHandler(async (req, res) => {
        const { phone, password } = req.body;

        if (!phone || !password) {
            throw new ApiError(400, 'Phone and password are required');
        }

        const result = await DriverService.login(phone, password);
        return res.status(200).json(new ApiResponse(200, result, 'Login successful'));
    });

    static refresh = asyncHandler(async (req, res) => {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            throw new ApiError(400, 'Refresh token is required');
        }

        const newTokens = await DriverService.refreshSession(refresh_token);
        return res.status(200).json(new ApiResponse(200, newTokens, 'Token refreshed successfully'));
    });
}

module.exports = DriverController;
