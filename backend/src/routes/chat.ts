import { Router } from 'express';
import { sendMessage, getChatHistory, clearChatHistory } from '../controllers/chatController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

// Chat operations
router.post('/messages', sendMessage);
router.get('/history', getChatHistory);
router.delete('/history', clearChatHistory);

export default router;

