const express = require('express');
const { verifyToken } = require('../middleware/auth');
const DriverController = require('../controllers/driver.controller');
const TripController = require('../controllers/trip.controller');

const router = express.Router();

// Public auth endpoints
router.post('/auth/login', DriverController.login);
router.post('/auth/refresh', DriverController.refresh);

// Protected trip endpoints (Must have valid JWT)
router.get('/trip', verifyToken, TripController.getTrip);
router.post('/trip/:id/start', verifyToken, TripController.startTrip);
router.post('/trip/:id/end', verifyToken, TripController.endTrip);

module.exports = router;
