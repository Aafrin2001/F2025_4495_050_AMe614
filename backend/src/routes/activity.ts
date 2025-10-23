import { Router } from 'express';
import { 
  createActivity, 
  getActivities, 
  completeActivity, 
  submitGameScore, 
  getGameScores, 
  getActivityStats 
} from '../controllers/activityController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All activity routes require authentication
router.use(authenticateToken);

// Activity CRUD operations
router.post('/', createActivity);
router.get('/', getActivities);
router.put('/:id/complete', completeActivity);
router.get('/stats', getActivityStats);

// Game score operations
router.post('/games/scores', submitGameScore);
router.get('/games/scores', getGameScores);

export default router;

