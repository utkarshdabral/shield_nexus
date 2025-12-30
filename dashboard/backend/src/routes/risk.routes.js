import { Router } from 'express';
import * as riskController from '../controllers/risk.controller.js';
import { validate, riskQuerySchema } from '../utils/validation.js';

const router = Router();

/**
 * Risk Index Routes
 */

// Get current risk
router.get('/current', riskController.getCurrentRisk);

// Get risk history
router.get('/history', validate(riskQuerySchema, 'query'), riskController.getHistory);

// Force compute risk
router.post('/compute', riskController.computeRisk);

// Get correlation data
router.get('/correlation', riskController.getCorrelation);

// Get dashboard summary
router.get('/summary', riskController.getSummary);

export default router;
