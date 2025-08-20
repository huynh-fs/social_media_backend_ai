import express from 'express';
import protect from '../middleware/auth';
import { followUser, unfollowUser, getSuggestions, getUserProfile } from '../controllers/userController';

const router = express.Router();

// Get user by ID
router.get('/:id/profile', protect, getUserProfile);

router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

router.get('/suggestions', protect, getSuggestions);

export default router;


