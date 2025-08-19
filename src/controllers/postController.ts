import { Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';

// @desc    Search users and posts
// @route   GET /api/search
// @access  Private
export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim() === '') {
      res.status(400).json({ message: 'Missing search query' });
      return;
    }
    // Search users by username
    const users = await User.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(5)
      .select('_id username avatarUrl');

    // Search posts by content
    const posts = await Post.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
      .select('_id content imageURL user createdAt');

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
    const { content } = req.body;
    let imageURL = '';

    // Xử lý file từ multer
    if (req.file) {
      // Use 'path' property as fallback, and check for possible custom property
      imageURL = (req.file as any).cloudinaryUrl || req.file.path;
      console.log('Image file found:', req.file);
      console.log('Image URL:', imageURL);
    }

    const post = await Post.create({
      content,
      imageURL,
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

    const [totalPosts, posts] = await Promise.all([
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

    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      res.json({ message: 'Post unliked' });
    } else {
      // Like
      const like = await Like.create({ user: userId, post: postId });
      await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
      res.json({ message: 'Post liked' });
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

    const comment = await Comment.create({
      text,
      user: userId,
      post: postId
    });

    await comment.populate('user', 'username avatarUrl');
    
    // Add comment to post
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    res.status(201).json(comment);
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
      .populate('user', 'username avatar')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'username avatarUrl' }
      });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    console.error('Get post by id error:', error);
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

    const [totalPosts, posts] = await Promise.all([
      Post.countDocuments({ user: { $in: following } }),
      Post.find({ user: { $in: following } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username avatar')
        .populate({
          path: 'comments',
          select: 'text user createdAt',
          populate: { path: 'user', select: 'username avatarUrl' }
        })
    ]);

    const totalPages = Math.ceil(totalPosts / limit) || 1;

    res.json({ posts, page, totalPages, totalPosts });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};