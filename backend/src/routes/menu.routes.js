const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const menuController = require("../controllers/menu.controller");

router.get("/menu", menuController.getMenuItems);
router.get("/menu/:id", menuController.getMenuItemById);
router.post("/menu", upload.single("image"), menuController.createMenuItem);
router.put("/menu/:id", upload.single("image"), menuController.updateMenuItem);
router.delete("/menu/:id", menuController.deleteMenuItem);

module.exports = router;