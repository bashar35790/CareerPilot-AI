import { Router } from 'express';
import { sendSuccess } from '../lib/response';
import authRoutes from './auth.routes';

const router = Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy' });
});

router.use('/auth', authRoutes);

export default router;
