import express from 'express';
import protect from '../middleware/auth';
import { followUser, unfollowUser, getSuggestions } from '../controllers/userController';

const router = express.Router();

router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

router.get('/suggestions', protect, getSuggestions);

export default router;


