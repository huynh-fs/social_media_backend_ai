import { Request, Response } from 'express';
import Notification from '../models/Notification';

// GET /api/notifications
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const limit = Math.max(parseInt((req.query.limit as string) || '10', 10), 1);
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments({ recipient: userId }),
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatarUrl')
        .populate('post', 'content')
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    res.json({ notifications, page, totalPages, total });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/notifications/read
export const markNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
