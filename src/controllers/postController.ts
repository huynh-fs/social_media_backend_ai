import Notification from '../models/Notification';
// For socket.io access
import { getSocketIO, getOnlineUsers } from '../server';
import { Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';

// @desc    Search users and posts
// @route   GET /api/search
// @access  Private
export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim() === '' || query === 'search') {
      res.status(400).json({ message: 'Missing or invalid search query' });
      return;
    }
    // User: search by username only
    const users = await User.find({ username: { $regex: query, $options: 'i' } })
      .limit(5)
      .select('_id username avatarUrl');

    // Post: search by content only
    const posts = await Post.find({ hashtags: { $regex: query, $options: 'i' } })
      .limit(10)
      .select('_id content imageURL user createdAt hashtags')
      .populate('user', 'username avatarUrl');

    res.status(200).json({ users, posts });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// ./src/controllers/postController.ts

// Removed duplicate imports
import Comment from '../models/Comment';
import Like from '../models/Like';

// Extend Request interface for multer

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req: Request, res: Response): Promise<void> => {
  console.log('req.body', req.body);
  try {
    let { content } = req.body;
    let imageURL = '';

    // Xử lý file từ multer
    if (req.file) {
      imageURL = (req.file as any).cloudinaryUrl || req.file.path;
      console.log('Image file found:', req.file);
      console.log('Image URL:', imageURL);
    }

    // Tách hashtag từ content
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      hashtags.push(match[1]);
    }
    // Xóa hashtag khỏi content nếu muốn lưu content sạch
    // Nếu muốn giữ nguyên content, bỏ dòng dưới
    // content = content.replace(hashtagRegex, '').trim();

    const post = await Post.create({
      content,
      imageURL,
      hashtags,
      user: req.user?._id
    });

    await post.populate('user', 'username avatarUrl');

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const limit = Math.max(parseInt((req.query.limit as string) || '10', 10), 1);
    const skip = (page - 1) * limit;

    const [totalPosts, postsRaw] = await Promise.all([
      Post.countDocuments({}),
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username avatarUrl')
        .populate({
          path: 'comments',
          select: 'text user createdAt',
          populate: { path: 'user', select: 'username avatarUrl' }
        })
    ]);

    const userId = req.user?._id?.toString();
    const posts = postsRaw.map(post => {
      const likeCount = post.likes ? post.likes.length : 0;
      const isLikedByCurrentUser = userId ? post.likes.some((id: any) => id.toString() === userId) : false;
      return {
        ...post.toObject(),
        likeCount,
        isLikedByCurrentUser,
        hashtags: post.hashtags || []
      };
    });

    const totalPages = Math.ceil(totalPosts / limit) || 1;

    res.json({ posts, page, totalPages, totalPosts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like/Unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id;
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    const recipientId = post.user.toString();
    const senderId = userId?.toString();
    const existingLike = await Like.findOne({ user: userId, post: postId });

    let action = '';
    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      action = 'unliked';
      res.json({ message: 'Post unliked' });
    } else {
      // Like
      await Like.create({ user: userId, post: postId });
      await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
      action = 'liked';
      res.json({ message: 'Post liked' });
      // Notification logic
      if (recipientId !== senderId) {
        let notification = await Notification.create({
          recipient: recipientId,
          sender: senderId,
          type: 'like',
          post: postId
        });
        // Populate sender and post fields
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'username avatarUrl')
          .populate('post', 'content');
        // Real-time emit
        const io = getSocketIO();
        const onlineUsers = getOnlineUsers();
        const socketId = onlineUsers.get(recipientId);
        if (socketId && populatedNotification) {
          io.to(socketId).emit('new_notification', populatedNotification);
        }
      }
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user?._id;
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    const recipientId = post.user.toString();
    const senderId = userId?.toString();
    const comment = await Comment.create({
      text,
      user: userId,
      post: postId
    });
    await comment.populate('user', 'username avatarUrl');
    // Add comment to post
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
    res.status(201).json(comment);
    // Notification logic
    if (recipientId !== senderId) {
      let notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'comment',
        post: postId
      });
      // Populate sender and post fields
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username avatarUrl')
        .populate('post', 'content');
      // Real-time emit
      const io = getSocketIO();
      const onlineUsers = getOnlineUsers();
      const socketId = onlineUsers.get(recipientId);
      if (socketId && populatedNotification) {
        io.to(socketId).emit('new_notification', populatedNotification);
      }
    }
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single post by ID with populated user and comments
// @route   GET /api/posts/:id
// @access  Private
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate('user', 'username avatarUrl')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username avatarUrl' }
      });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    // Đảm bảo trả về hashtags
    const postObj = {
      ...post.toObject(),
      hashtags: post.hashtags || []
    };
    res.json(postObj);
  } catch (error) {
    console.error('Get post by id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get list posts by user ID with populated user and comments
// @route   GET /api/posts/user/:id
// @access  Private
export const getPostsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const posts = await Post.find({ user: userId })
      .populate('user', 'username avatarUrl')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username avatarUrl' }
      });

    res.json(posts);
  } catch (error) {
    console.error('Get posts by user id error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a post (only owner)
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id?.toString();

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    if (!userId || post.user.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this post' });
      return;
    }

    await Promise.all([
      Comment.deleteMany({ post: postId }),
      Like.deleteMany({ post: postId }),
      Post.findByIdAndDelete(postId)
    ]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get feed posts (from users the current user follows)
// @route   GET /api/posts/feed
// @access  Private
export const getFeedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const following = (req.user as any)?.following || [];

    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const limit = Math.max(parseInt((req.query.limit as string) || '10', 10), 1);
    const skip = (page - 1) * limit;

    const [totalPosts, postsRaw] = await Promise.all([
      Post.countDocuments({ user: { $in: following } }),
      Post.find({ user: { $in: following } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username avatarUrl')
        .populate({
          path: 'comments',
          select: 'text user createdAt',
          populate: { path: 'user', select: 'username avatarUrl' }
        })
    ]);

    const userId = req.user?._id?.toString();
    const posts = postsRaw.map(post => {
      const likeCount = post.likes ? post.likes.length : 0;
      const isLikedByCurrentUser = userId ? post.likes.some((id: any) => id.toString() === userId) : false;
      return {
        ...post.toObject(),
        likeCount,
        isLikedByCurrentUser,
        hashtags: post.hashtags || []
      };
    });

    const totalPages = Math.ceil(totalPosts / limit) || 1;

    res.json({ posts, page, totalPages, totalPosts });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};