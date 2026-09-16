const express = require('express');
const DriverController = require('../controllers/driver.controller');

const router = express.Router();

// Public auth endpoints (no JWT required to access these)
router.post('/auth/login', DriverController.login);
router.post('/auth/refresh', DriverController.refresh);

module.exports = router;
