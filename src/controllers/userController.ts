import { Request, Response, NextFunction } from "express"; // ✨ Thêm NextFunction
import User from "../models/User";
import Notification from "../models/Notification";
import { getIO, onlineUsers } from "../sockets/socketHandlers";

// =========================================================================
// @desc    Get user profile by ID
// @route   GET /api/users/:id/profile
// @access  Private
// =========================================================================
export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction // ✨ Dùng next để chuyển lỗi
): Promise<void> => {
  try {
    const userToFind = await User.findById(req.params.id).select("-password");
    if (!userToFind) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // ✨ Tối ưu: `req.user` đã có sẵn, không cần query lại DB
    const currentUser = req.user!; // Dùng `!` vì middleware `protect` đảm bảo user tồn tại

    const isFollowing = userToFind.followers.includes(currentUser._id);
    
    // ✨ Tránh trả về toàn bộ document, chỉ trả về những gì cần thiết
    res.status(200).json({
      _id: userToFind._id,
      username: userToFind.username,
      displayName: userToFind.username, // Giả sử `username` là tên hiển thị
      bio: userToFind.bio,
      avatarUrl: userToFind.avatarUrl,
      bannerUrl: '',
      isFollowing,
      followingCount: userToFind.following.length,
      followersCount: userToFind.followers.length,
    });
  } catch (error) {
    next(error); // ✨ Chuyển lỗi cho error handler chung xử lý
  }
};

// =========================================================================
// @desc    Get user suggestions for "Who to follow"
// @route   GET /api/users/suggestions
// @access  Private
// =========================================================================
export const getSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user!._id;

    // ✨ Tối ưu: Lấy user hiện tại từ `req.user` thay vì query lại.
    // Middleware `protect` nên populate đầy đủ thông tin user.
    const currentUserFollowing = req.user!.following || [];
    
    const usersToExclude = [currentUserId, ...currentUserFollowing];

    const suggestions = await User.aggregate([
      { $match: { _id: { $nin: usersToExclude } } },
      { $sample: { size: 5 } },
      { $project: { password: 0, followers: 0, following: 0, email: 0 } }, // ✨ Loại bỏ các trường không cần thiết
    ]);
    
    res.status(200).json(suggestions);
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// @desc    Get my followers
// @route   GET /api/users/:id/followers
// @access  Private
// =========================================================================
export const getMyFollowers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).populate("followers", "username avatarUrl");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user.followers);
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// @desc    Follow a user
// @route   POST /api/users/:id/follow
// @access  Private
// =========================================================================
export const followUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!._id;

    if (targetUserId === currentUserId.toString()) {
      res.status(400).json({ message: "You cannot follow yourself" });
      return;
    }

    // ✨ Tối ưu: Dùng Promise.all để thực hiện 2 thao tác DB song song
    const [currentUser, targetUser] = await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } }),
      User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } })
    ]);

    if (!targetUser) {
      res.status(404).json({ message: "User to follow not found" });
      return;
    }

    // ✨ Logic thông báo được làm gọn gàng hơn
    const notification = await Notification.create({
      recipient: targetUserId,
      sender: currentUserId,
      type: "follow",
    });
    
    const populatedNotification = await notification.populate('sender', 'username avatarUrl');
    
    const receiverSocketId = onlineUsers.get(targetUserId);
    if (receiverSocketId) {
      getIO().to(receiverSocketId).emit("new_notification", populatedNotification);
    }
    
    res.status(200).json({ message: "User followed successfully" });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// @desc    Unfollow a user
// @route   POST /api/users/:id/unfollow
// @access  Private
// =========================================================================
export const unfollowUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!._id;

    if (targetUserId === currentUserId.toString()) {
      res.status(400).json({ message: "You cannot unfollow yourself" });
      return;
    }

    // ✨ Tối ưu: Dùng Promise.all
    const [currentUser, targetUser] = await Promise.all([
      User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } }),
      User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } })
    ]);

    if (!targetUser) {
        res.status(404).json({ message: "User to unfollow not found" });
        return;
    }

    // ✨ Tùy chọn: Xóa thông báo "follow" khi unfollow
    await Notification.deleteOne({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow'
    });
    
    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    next(error);
  }
};