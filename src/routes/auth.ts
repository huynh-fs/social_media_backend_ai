import express from 'express';
import { register, login, getProfile, updateMyProfile } from '../controllers/authController';
import protect from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/me',protect, upload, updateMyProfile);

export default router;
