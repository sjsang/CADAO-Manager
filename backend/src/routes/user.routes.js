const userController = require("../controllers/user.controller");
const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middlewares/auth.middleware");

router.post("/", authenticate, requireRole("admin"), userController.createUserByAdmin);
router.get("/", authenticate, requireRole("admin"), userController.getUsers);
router.get("/:id", authenticate, requireRole("admin"), userController.getUserById);
router.patch("/:id/toggle-status", authenticate, requireRole("admin"), userController.toggleUserStatus);

module.exports = router;