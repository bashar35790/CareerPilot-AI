import { Router } from 'express';
import { create, getById, list, toggleTask } from '../controllers/roadmap.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createRoadmapSchema,
  listRoadmapsQuerySchema,
  roadmapIdParamSchema,
  roadmapTaskIdParamSchema,
  updateRoadmapTaskSchema,
} from '../schemas/roadmap.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createRoadmapSchema), create);
router.get('/', validate(listRoadmapsQuerySchema, 'query'), list);
router.get('/:id', validate(roadmapIdParamSchema, 'params'), getById);
router.patch(
  '/tasks/:taskId',
  validate(roadmapTaskIdParamSchema, 'params'),
  validate(updateRoadmapTaskSchema, 'body'),
  toggleTask
);

export default router;
