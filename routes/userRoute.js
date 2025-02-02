const express = require("express")
const router =  express.Router();
const userController = require("./../controllers/userController")
const authController = require("./../controllers/authController")

router.route("/updateMe").post( authController.protect, userController.updateMe)
router.route("/updatePassword").post(authController.protect, userController.updatePassword)
router.route("/allUsers").get(authController.protect, userController.allUsers)
router.route("/deleteMe").delete(authController.protect, authController.restrict(['admin', 'user']),  userController.deleteMe)
router.route("/userProfile").get(authController.protect, userController.userProfile)

module.exports = router
