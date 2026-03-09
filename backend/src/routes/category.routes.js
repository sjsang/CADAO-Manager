const express = require("express");
const router = express.Router();
const menuController = require("../controllers/category.controller");

router.get("/categories", menuController.getCategories);

module.exports = router;