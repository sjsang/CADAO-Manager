const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const { authenticate, requireRole } = require("../middlewares/auth.middleware");

router.get("/", authenticate, requireRole("admin"), customerController.getCustomers);
router.put("/me", authenticate, requireRole("customer"), customerController.updateCustomer);

// Address Management Routes
router.get("/addresses", authenticate, requireRole("customer"), customerController.getAddresses);
router.post("/addresses", authenticate, requireRole("customer"), customerController.addAddress);
router.put("/addresses/:id", authenticate, requireRole("customer"), customerController.updateAddress);
router.delete("/addresses/:id", authenticate, requireRole("customer"), customerController.deleteAddress);
router.post("/addresses/set-default", authenticate, requireRole("customer"), customerController.setDefaultAddress);

module.exports = router;