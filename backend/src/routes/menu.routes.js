const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const menuController = require("../controllers/menu.controller");

router.get("/", menuController.getMenuItems);
router.get("/:id", menuController.getMenuItemById);
router.post("/", upload.single("image"), menuController.createMenuItem);
router.put("/:id", upload.single("image"), menuController.updateMenuItem);
router.delete("/:id", menuController.deleteMenuItem);

module.exports = router;