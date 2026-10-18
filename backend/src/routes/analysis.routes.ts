import { Router } from 'express';
import { create, getById, list, remove } from '../controllers/analysis.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  analysisIdParamSchema,
  createAnalysisSchema,
  listAnalysesQuerySchema,
} from '../schemas/analysis.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createAnalysisSchema), create);
router.get('/', validate(listAnalysesQuerySchema, 'query'), list);
router.get('/:id', validate(analysisIdParamSchema, 'params'), getById);
router.delete('/:id', validate(analysisIdParamSchema, 'params'), remove);

export default router;
