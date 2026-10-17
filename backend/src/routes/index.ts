import { Router } from 'express';
import { sendSuccess } from '../lib/response';

const router = Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'healthy' });
});

export default router;
