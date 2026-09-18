const express = require('express');
const { verifyToken } = require('../middleware/auth');
const DriverController = require('../controllers/driver.controller');
const TripController = require('../controllers/trip.controller');

const router = express.Router();

// Public auth endpoints
router.post('/auth/login', DriverController.login);
router.post('/auth/refresh', DriverController.refresh);
router.post('/auth/logout', verifyToken, DriverController.logout);

// Protected trip endpoints (Must have valid JWT)
router.get('/trip', verifyToken, TripController.getTrip);
router.get('/trip/:id/details', verifyToken, TripController.getTripDetails);
router.post('/trip/:id/start', verifyToken, TripController.startTrip);
router.post('/trip/:id/location', verifyToken, TripController.submitLocation);
router.post('/trip/:id/end', verifyToken, TripController.endTrip);

module.exports = router;
