import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/sign-in', (req, res) => authController.signIn(req, res));
router.post('/sign-up', (req, res) => authController.signUp(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));
router.post('/sign-out', (req, res) => authController.signOut(req, res));

router.get('/me', authenticateToken, (req, res) => authController.me(req, res));
router.patch('/profile', authenticateToken, (req, res) => authController.updateProfile(req, res));

export default router;
