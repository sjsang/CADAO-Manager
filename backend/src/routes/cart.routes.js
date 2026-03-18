const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/", authenticate, cartController.getCartItems);
router.post("/", authenticate, cartController.addCartItem);
router.put("/", authenticate, cartController.updateCartItem);
router.delete("/", authenticate, cartController.deleteCartItem);
router.delete("/all", authenticate, cartController.deleteAllCartItems);

module.exports = router;