import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  signupHandler,
  loginHandler,
  logoutHandler,
  validateSignup,
  validateLogin,
} from '../controllers/authController';

const router = Router();

router.post('/signup', authRateLimiter, validateSignup, signupHandler);
router.post('/login', authRateLimiter, validateLogin, loginHandler);
router.post('/logout', authenticateToken, logoutHandler);

export default router;
