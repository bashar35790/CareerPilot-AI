import { Router } from 'express';
import { sendSuccess } from '../lib/response';

const router = Router();

router.get('/health', (_req, res) => {
  return sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;
