import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message'; // Import Message model

// Map<userId, socketId>
export const onlineUsers = new Map<string, string>();

let ioInstance: Server | null = null; // ✨ Thêm biến này để lưu instance của io

export const getIO = () => { // ✨ Tạo một hàm getter để truy cập an toàn
    if (!ioInstance) {
        throw new Error("Socket.IO not initialized!");
    }
    return ioInstance;
}

export const initializeSocketIO = (io: Server) => {
  ioInstance = io; // Lưu instance của io
  // Middleware xác thực token cho mỗi kết nối socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication Error: Token not provided.'));
    }
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) {
        return next(new Error('Authentication Error: Invalid Token.'));
      }
      // Gán thông tin user (payload từ token) vào socket để sử dụng sau này
      (socket as any).user = decoded;
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);
    const user = (socket as any).user; // Lấy user từ middleware

    // Lắng nghe sự kiện "addUser" từ client sau khi kết nối thành công
    socket.on('addUser', (userId: string) => {
      if (userId && userId === user.id) { // Đảm bảo client chỉ add chính mình
        onlineUsers.set(userId, socket.id);
        console.log(`User ${userId} is online with socket ${socket.id}`);
        // Gửi lại danh sách user online cho tất cả clients
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
      }
    });

    // Lắng nghe sự kiện "send_message"
    socket.on('send_message', async (data: { receiverId: string; content: string }) => {
      const { receiverId, content } = data;
      const senderId = user.id;

      try {
        // 1. Lưu tin nhắn vào cơ sở dữ liệu
        const newMessage = new Message({
          sender: senderId,
          receiver: receiverId,
          content: content,
        });
        const savedMessage = await newMessage.save();
        
        // Populate thông tin người gửi/nhận để gửi về client
        const populatedMessage = await savedMessage.populate([
          { path: 'sender', select: '_id username avatarUrl' },
          { path: 'receiver', select: '_id username avatarUrl' },
        ]);

        // 2. Tìm socket của người nhận
        const receiverSocketId = onlineUsers.get(receiverId);

        // 3. Gửi tin nhắn đến người nhận nếu họ đang online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', populatedMessage);
        }
        
        // 4. Gửi lại tin nhắn cho chính người gửi để xác nhận và cập nhật UI
        socket.emit('receive_message', populatedMessage);

      } catch (error) {
        console.error('Error handling send_message:', error);
      }
    });

    // Xử lý khi client ngắt kết nối
    socket.on('disconnect', () => {
      // Xóa user khỏi danh sách online
      if (user && user.id) {
        if (onlineUsers.get(user.id) === socket.id) {
            onlineUsers.delete(user.id);
            console.log(`User ${user.id} offline (socket ${socket.id})`);
        }
      }
      // Cập nhật lại danh sách user online cho tất cả clients
      io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
      console.log('Socket disconnected:', socket.id);
    });
  });
};