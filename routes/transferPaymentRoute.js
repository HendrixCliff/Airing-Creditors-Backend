const express = require('express');
const  createVirtualAccount  = require('../controllers/transferPaymentController.js');
const  chooseTransactionAction  = require('../controllers/transferPaymentController.js');
const authController = require("../controllers/authController.js");

const router = express.Router();


router.post('/create-virtual-account', authController.protect, createVirtualAccount);
router.post('/flutterwave-webhook', flutterwaveWebhook)
router.post('/chooseTransactionAction', authController.protect, chooseTransactionAction);

module.exports = router;


// 1️⃣ Go to Flutterwave Dashboard
// 2️⃣ Navigate to Settings > Webhooks
// 3️⃣ Add your webhook URL:

// ruby
// Copy
// Edit
// https://yourdomain.com/api/webhooks/flutterwave-webhook