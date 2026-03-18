const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.post("/register", authController.registerCustomer);
router.post("/login", authController.loginCustomer);
router.post("/logout", authenticate, authController.logoutCustomer);
router.get("/me", authenticate, authController.getCustomerById);

module.exports = router;