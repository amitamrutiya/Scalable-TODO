import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getMeHandler,
  updateMeHandler,
  validateUpdateProfile,
} from '../controllers/userController';

const router = Router();

// Apply auth middleware to all user routes
router.use(authenticateToken);

router.get('/me', getMeHandler);
router.patch('/me', validateUpdateProfile, updateMeHandler);

export default router;
