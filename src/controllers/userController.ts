import { Request, Response } from 'express';
import User from '../models/User';

export const followUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?._id?.toString();

    if (!currentUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (targetUserId === currentUserId) {
      res.status(400).json({ message: 'You cannot follow yourself' });
      return;
    }

    const targetUser = await User.findById(targetUserId).select('_id');
    if (!targetUser) {
      res.status(404).json({ message: 'Target user not found' });
      return;
    }

    await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: targetUserId } },
      { new: true }
    ).select('-password');

    await User.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: currentUserId } },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Followed user successfully' });
  } catch (error) {
    console.error('followUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?._id?.toString();

    if (!currentUserId) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (targetUserId === currentUserId) {
      res.status(400).json({ message: 'You cannot unfollow yourself' });
      return;
    }

    const targetUser = await User.findById(targetUserId).select('_id');
    if (!targetUser) {
      res.status(404).json({ message: 'Target user not found' });
      return;
    }

    await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: targetUserId } },
      { new: true }
    ).select('-password');

    await User.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: currentUserId } },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Unfollowed user successfully' });
  } catch (error) {
    console.error('unfollowUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  followUser,
  unfollowUser
};


