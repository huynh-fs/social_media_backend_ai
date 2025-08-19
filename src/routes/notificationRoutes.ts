import express from 'express';
import { getNotifications, markNotificationsRead } from '../controllers/notificationController';
import protect from '../middleware/auth';

const router = express.Router();

// Lấy danh sách thông báo (có phân trang)
router.get('/', protect, getNotifications);
// Đánh dấu tất cả thông báo là đã đọc
router.post('/read', protect, markNotificationsRead);

export default router;
