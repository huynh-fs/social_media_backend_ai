import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';
import mongoose from 'mongoose';

// Lấy danh sách các cuộc trò chuyện
export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id;
  try {
    const conversations = await Message.aggregate([
      // 1. Tìm tất cả tin nhắn liên quan đến user
      { $match: { $or: [{ sender: new mongoose.Types.ObjectId(userId) }, { receiver: new mongoose.Types.ObjectId(userId) }] } },
      
      // 2. Sắp xếp theo thời gian để lấy tin nhắn cuối cùng
      { $sort: { createdAt: -1 } },
      
      // 3. Nhóm theo cặp người dùng (sender/receiver)
      {
        $group: {
          _id: {
            $cond: {
              if: { $gt: ['$sender', '$receiver'] },
              then: { sender: '$sender', receiver: '$receiver' },
              else: { sender: '$receiver', receiver: '$sender' },
            }
          },
          lastMessage: { $first: '$$ROOT' }
        }
      },

      // 4. Định hình lại document
      {
        $project: {
          _id: 0,
          participantId: {
            $cond: {
              if: { $eq: ['$lastMessage.sender', new mongoose.Types.ObjectId(userId)] },
              then: '$lastMessage.receiver',
              else: '$lastMessage.sender'
            }
          },
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt'
          }
        }
      },
      
      // 5. Populate thông tin người đối thoại
      {
        $lookup: {
          from: 'users',
          localField: 'participantId',
          foreignField: '_id',
          as: 'participant'
        }
      },
      { $unwind: '$participant' },

      // 6. Project lần cuối
      {
        $project: {
          'participant._id': 1,
          'participant.username': 1,
          'participant.avatarUrl': 1,
          'lastMessage': 1,
          // unreadCount cần logic phức tạp hơn, tạm thời để là 0
          'unreadCount': { $const: 0 } 
        }
      }
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

// Lấy lịch sử tin nhắn với một người dùng cụ thể
export const getMessagesWithUser = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id;
  const { otherUserId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', '_id username avatarUrl')
    .populate('receiver', '_id username avatarUrl');
    
    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};