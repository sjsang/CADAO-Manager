const userController = require("../controllers/user.controller");
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/", authenticate, userController.getUsers);

module.exports = router;