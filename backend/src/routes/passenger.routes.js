const express = require('express');
const PassengerController = require('../controllers/passenger.controller');

const router = express.Router();

// These endpoints are completely public (no JWT auth required)
router.get('/routes', PassengerController.getAllRoutes);
router.get('/routes/:routeId/buses', PassengerController.getBusesForRoute);
router.get('/trip/:tripId/location', PassengerController.getTripLocation);

module.exports = router;
