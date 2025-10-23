import { Router } from 'express';
import { 
  createHealthRecord, 
  getHealthRecords, 
  getHealthSummary, 
  updateHealthRecord, 
  deleteHealthRecord 
} from '../controllers/healthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All health routes require authentication
router.use(authenticateToken);

// Health record CRUD operations
router.post('/records', createHealthRecord);
router.get('/records', getHealthRecords);
router.get('/summary', getHealthSummary);
router.put('/records/:id', updateHealthRecord);
router.delete('/records/:id', deleteHealthRecord);

export default router;

