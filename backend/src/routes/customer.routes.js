const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const { authenticate, requireRole } = require("../middlewares/auth.middleware");

router.get("/", authenticate, requireRole("admin"), customerController.getCustomers);
router.put("/me", authenticate, requireRole("customer"), customerController.updateCustomer);

module.exports = router;