import { Router } from 'express';
import { sendSuccess } from '../lib/response';
import authRoutes from './auth.routes';
import jobRoutes from './jobs.routes';
import resumeRoutes from './resumes.routes';

const router = Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy' });
});

router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/jobs', jobRoutes);

export default router;
