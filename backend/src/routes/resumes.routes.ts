import { Router } from 'express';
import { create, getById, list, remove, update } from '../controllers/resumes.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createResumeSchema,
  resumeIdParamSchema,
  updateResumeSchema,
} from '../schemas/resume.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createResumeSchema), create);
router.get('/', list);
router.get('/:id', validate(resumeIdParamSchema, 'params'), getById);
router.put('/:id', validate(resumeIdParamSchema, 'params'), validate(updateResumeSchema), update);
router.delete('/:id', validate(resumeIdParamSchema, 'params'), remove);

export default router;
