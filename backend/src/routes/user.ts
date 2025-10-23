import { Router } from 'express';
import { getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

// User profile operations
router.get('/profile', getProfile);

export default router;

