import express from "express";
import {
  getConversations,
  getMessagesWithUser,
} from "../controllers/chatController";
import protect from "../middleware/auth"; // Giả sử bạn có middleware này

const router = express.Router();

// Middleware `protect` sẽ được áp dụng cho tất cả các route trong file này
router.use(protect);

router.get("/conversations", getConversations);
router.get("/messages/:otherUserId", getMessagesWithUser);

export default router;
