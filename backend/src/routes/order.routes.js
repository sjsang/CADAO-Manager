const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");

const orderController = require("../controllers/order.controller");

router.post("/", authenticate, orderController.createOrUpdateOrder);
router.get("/", authenticate, orderController.getOrdersByCustomerId);
router.get("/:orderCode", authenticate, orderController.getOrderByOrderCode);
router.post("/:orderCode/confirm", authenticate, orderController.confirmOrder);
router.post("/:orderCode/cancel", authenticate, orderController.cancelOrder);

module.exports = router;