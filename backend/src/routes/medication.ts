import { Router } from 'express';
import { 
  createMedication, 
  getMedications, 
  updateMedication, 
  deleteMedication, 
  getMedicationReminders 
} from '../controllers/medicationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All medication routes require authentication
router.use(authenticateToken);

// Medication CRUD operations
router.post('/', createMedication);
router.get('/', getMedications);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);
router.get('/reminders', getMedicationReminders);

export default router;

