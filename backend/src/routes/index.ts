import { Router } from 'express';
import { sendSuccess } from '../lib/response';
import analysisRoutes from './analysis.routes';
import authRoutes from './auth.routes';
import jobRoutes from './jobs.routes';
import resumeRoutes from './resumes.routes';
import userRoutes from './users.routes';

const router = Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy' });
});

router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/jobs', jobRoutes);
router.use('/users', userRoutes);
router.use('/analyses', analysisRoutes);

export default router;
