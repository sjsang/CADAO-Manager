const userController = require("../controllers/user.controller");
const express = require("express");
const router = express.Router();
const { authenticate, requireAnyRole, requireRole } = require("../middlewares/auth.middleware");

router.post("/", authenticate, requireRole("admin"), userController.createUserByAdmin);
router.get("/", authenticate, requireRole("admin"), userController.getUsers);
router.get("/me", authenticate, requireAnyRole("admin", "staff", "shipper"), userController.getMyProfile);
router.patch("/me", authenticate, requireAnyRole("admin", "staff", "shipper"), userController.updateMyProfile);
router.get("/:id", authenticate, requireRole("admin"), userController.getUserById);
router.patch("/:id/toggle-status", authenticate, requireRole("admin"), userController.toggleUserStatus);
router.patch("/:id", authenticate, requireRole("admin"), userController.updateUser);

module.exports = router;