import { Request, Response } from "express";
import User from "../models/User";
import Notification from "../models/Notification";
import { getOnlineUsers, getSocketIO } from "../server";

// @desc    Get user by ID
// @route   GET /api/users/:id/profile
// @access  Private
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const isFollowing = user.followers.includes(req.user?._id);
    const followingCount = user.following.length;
    const followersCount = user.followers.length;
    res.json({
      ...user.toObject(),
      isFollowing,
      followingCount,
      followersCount,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user suggestions
// @route   GET /api/users/suggestions
// @access  Private
export const getSuggestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentUserId = req.user?._id;
    if (!currentUserId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    // Get current user's following list
    const currentUser = await User.findById(currentUserId);
    const following = currentUser?.following || [];
    // Exclude current user and users already followed
    const excludeIds = [currentUserId, ...following];
    // Find 5 random users not followed by current user
    const suggestions = await User.aggregate([
      { $match: { _id: { $nin: excludeIds } } },
      { $sample: { size: 5 } },
      { $project: { _id: 1, username: 1, avatarUrl: 1 } },
    ]);
    res.json(suggestions);
  } catch (error) {
    console.error("Get suggestions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Removed duplicate imports

export const followUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?._id?.toString();

    if (!currentUserId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (targetUserId === currentUserId) {
      res.status(400).json({ message: "You cannot follow yourself" });
      return;
    }

    const targetUser = await User.findById(targetUserId).select("_id");
    if (!targetUser) {
      res.status(404).json({ message: "Target user not found" });
      return;
    }

    await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: targetUserId } },
      { new: true }
    ).select("-password");

    await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: currentUserId } },
      { new: true }
    ).select("-password");

    // Notification logic
    if (targetUserId !== currentUserId) {
      let notification = await Notification.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: "follow",
        post: null,
      });
      // Populate sender and post fields
      const populatedNotification = await Notification.findById(
        notification._id
      )
        .populate("sender", "username avatarUrl")
        .populate("post", "content");
      // Real-time emit
      const io = getSocketIO();
      const onlineUsers = getOnlineUsers();
      const socketId = onlineUsers.get(targetUserId);
      if (socketId && populatedNotification) {
        io.to(socketId).emit("new_notification", populatedNotification);
      }
    }

    res.status(200).json({ message: "Followed user successfully" });
  } catch (error) {
    console.error("followUser error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const unfollowUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?._id?.toString();

    if (!currentUserId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    if (targetUserId === currentUserId) {
      res.status(400).json({ message: "You cannot unfollow yourself" });
      return;
    }

    const targetUser = await User.findById(targetUserId).select("_id");
    if (!targetUser) {
      res.status(404).json({ message: "Target user not found" });
      return;
    }

    await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: targetUserId } },
      { new: true }
    ).select("-password");

    await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: currentUserId } },
      { new: true }
    ).select("-password");

    res.status(200).json({ message: "Unfollowed user successfully" });
  } catch (error) {
    console.error("unfollowUser error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  followUser,
  unfollowUser,
  getSuggestions,
};
