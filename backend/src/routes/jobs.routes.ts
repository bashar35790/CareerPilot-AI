import { Router } from 'express';
import { create, getById, list, remove } from '../controllers/jobs.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createJobSchema, jobIdParamSchema } from '../schemas/job.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createJobSchema), create);
router.get('/', list);
router.get('/:id', validate(jobIdParamSchema, 'params'), getById);
router.delete('/:id', validate(jobIdParamSchema, 'params'), remove);

export default router;
