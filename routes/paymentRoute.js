const express = require("express");
const paymentController = require("./../controllers/paymentController");
const authController = require("../controllers/authController")

const router = express.Router()



router.route("/initiatePayment").post(authController.protect, authController.restrict('user'), paymentController.initiatePayment )
router.route("/verifyPayment").get(authController.protect, authController.restrict('user'), paymentController.verifyPayment)

module.exports = router