import { Router } from 'express';
import * as configController from '../controllers/config.controller.js';
import { validate, configUpdateSchema } from '../utils/validation.js';

const router = Router();

/**
 * Configuration Routes
 */

// Get all config
router.get('/', configController.getAllConfig);

// Get specific config value
router.get('/:key', configController.getConfigValue);

// Update config value
router.put('/:key', validate(configUpdateSchema), configController.updateConfig);

// Batch update config
router.post('/batch', configController.batchUpdateConfig);

export default router;
