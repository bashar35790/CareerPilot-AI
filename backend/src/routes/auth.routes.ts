import { Router } from 'express';
import { demo, login, logout, refresh, register } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/demo', demo);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
