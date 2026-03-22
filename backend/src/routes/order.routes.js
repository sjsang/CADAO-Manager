const express = require("express");
const router = express.Router();
const { authenticate, requireAnyRole, requireRole } = require("../middlewares/auth.middleware");

const orderController = require("../controllers/order.controller");

router.post("/", authenticate, requireRole("customer"), orderController.createOrUpdateOrder);
router.get("/shippers", authenticate, requireAnyRole("admin", "staff"), orderController.getShippers);
router.get("/my-deliveries", authenticate, requireRole("shipper"), orderController.getMyDeliveries);
router.get("/my-deliveries/history", authenticate, requireRole("shipper"), orderController.getMyDeliveryHistory);
router.get("/", authenticate, requireAnyRole("admin", "staff"), orderController.getAllOrders);
router.get("/me", authenticate, requireRole("customer"), orderController.getOrdersByCustomerId);
router.get("/:orderCode", authenticate, requireAnyRole("customer", "admin", "staff"), orderController.getOrderByOrderCode);
router.patch("/:orderCode/status", authenticate, requireRole("customer"), orderController.updateOrderStatus);
router.patch("/:orderCode/admin-status", authenticate, requireAnyRole("admin", "staff"), orderController.updateOrderStatusByAdmin);
router.patch("/:orderCode/shipper-complete", authenticate, requireRole("shipper"), orderController.completeDelivery);

module.exports = router;