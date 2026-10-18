import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/users.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../schemas/user.schema';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

export default router;
