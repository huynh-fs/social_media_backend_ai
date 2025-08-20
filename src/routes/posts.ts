// ./src/routes/posts.ts
import express from 'express';
import { createPost, getPosts, toggleLike, addComment, getPostById, deletePost, getFeedPosts, search, getPostsByUserId } from '../controllers/postController';
import protect from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// All routes are protected
router.use(protect);

// Post routes - tạm thời bỏ upload
router.get('/feed', getFeedPosts);
// Search endpoint - đặt trước :id để tránh trùng
router.get('/search', protect, search);
router.get('/:id', getPostById);
router.get('/user/:id', getPostsByUserId);
router.delete('/:id', deletePost);
router.post('/', upload, createPost); // Không có upload middleware
router.get('/', getPosts);

// Like/Unlike post
router.post('/:id/like', toggleLike);

// Comment routes
router.post('/:id/comments', addComment);

export default router;
