const express = require('express');
const { verifyGateway } = require('../middleware/gatewayAuth');
const SmsController = require('../controllers/sms.controller');

const router = express.Router();

// This endpoint is protected by the 'x-gateway-secret' header, NOT a JWT
router.post('/incoming', verifyGateway, SmsController.handleIncoming);

module.exports = router;
