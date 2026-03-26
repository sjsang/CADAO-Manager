const express = require("express");
const chatController = require("../controllers/chat.controller");
const { authenticate, requireAnyRole, requireRole } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/conversations/start", authenticate, requireRole("customer"), chatController.startConversation);
router.get("/conversations", authenticate, requireAnyRole("admin", "customer"), chatController.getConversations);
router.get("/conversations/:conversationId/messages", authenticate, requireAnyRole("admin", "customer"), chatController.getMessages);
router.patch("/conversations/:conversationId/read", authenticate, requireAnyRole("admin", "customer"), chatController.markMessagesAsRead);
router.patch("/conversations/:conversationId/bot-status", authenticate, requireRole("admin"), chatController.toggleBot);
router.get("/unread-count", authenticate, requireAnyRole("admin", "customer"), chatController.getUnreadCount);
router.post("/messages", authenticate, requireAnyRole("admin", "customer"), chatController.sendMessage);

module.exports = router;
