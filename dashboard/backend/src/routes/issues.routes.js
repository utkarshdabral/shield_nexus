import { Router } from 'express';
import { issuesController } from '../controllers/issues.controller.js';
import { validate } from '../utils/validation.js';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createIssueSchema = Joi.object({
    title: Joi.string().required(),
    type: Joi.string().required(),
    status: Joi.string().required(),
    location: Joi.string().allow('', null),
    description: Joi.string().allow('', null),
    risk_level: Joi.string().valid('High', 'Medium', 'Low')
});

// Routes
router.get('/', issuesController.getAll);
router.post('/', validate(createIssueSchema), issuesController.create);
router.get('/:id', issuesController.getById);
router.get('/:id/analytics', issuesController.getAnalytics);

export default router;
