const express = require("express");
const router = express.Router();
const menuTypeController = require("../controllers/menu_type.controller");

router.get("/", menuTypeController.getMenuTypes);

module.exports = router;