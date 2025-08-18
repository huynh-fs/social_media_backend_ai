import express from 'express';
import protect from '../middleware/auth';
import { followUser, unfollowUser } from '../controllers/userController';

const router = express.Router();

router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

export default router;


