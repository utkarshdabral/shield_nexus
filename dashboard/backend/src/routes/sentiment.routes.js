import { Router } from 'express';
import * as sentimentController from '../controllers/sentiment.controller.js';
import { validate, sentimentAnalyzeSchema, sentimentQuerySchema } from '../utils/validation.js';

const router = Router();

/**
 * Sentiment Analytics Routes
 */

// Analyze texts
router.post('/analyze', validate(sentimentAnalyzeSchema), sentimentController.analyzeTexts);

// Batch analyze
router.post('/batch', sentimentController.analyzeBatch);

// Get historical results
router.get('/results', validate(sentimentQuerySchema, 'query'), sentimentController.getResults);

// Get latest analyses
router.get('/latest', sentimentController.getLatest);

// Get aggregates
router.get('/aggregates', sentimentController.getAggregates);

// Get distribution for charts
router.get('/distribution', sentimentController.getDistribution);

// Get time series
router.get('/timeseries', sentimentController.getTimeSeries);

export default router;
