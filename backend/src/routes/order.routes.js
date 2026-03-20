const express = require("express");
const router = express.Router();
const { authenticate, requireAnyRole, requireRole } = require("../middlewares/auth.middleware");

const orderController = require("../controllers/order.controller");

router.post("/", authenticate, requireRole("customer"), orderController.createOrUpdateOrder);
router.get("/", authenticate, requireRole("admin"), orderController.getAllOrders);
router.get("/me", authenticate, requireRole("customer"), orderController.getOrdersByCustomerId);
router.get("/:orderCode", authenticate, requireAnyRole("customer", "admin"), orderController.getOrderByOrderCode);
router.patch("/:orderCode/status", authenticate, requireRole("customer"), orderController.updateOrderStatus);

module.exports = router;