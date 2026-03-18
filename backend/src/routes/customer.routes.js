const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.put("/update", authenticate, customerController.updateCustomer);

module.exports = router;