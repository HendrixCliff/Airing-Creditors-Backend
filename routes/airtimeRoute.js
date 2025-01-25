const express = require('express');
const router = express.Router();
const { sendAirtime } = require('./../controllers/airtimeController')

router.post('/sendAirtime', sendAirtime);
router.get('/airtimeResponse', airtimeResponse);

module.exports = router;