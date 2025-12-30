import { Router } from 'express';
import * as cctvController from '../controllers/cctv.controller.js';
import { validate, cctvAnalyzeSchema, cctvQuerySchema } from '../utils/validation.js';

const router = Router();

/**
 * CCTV Analytics Routes
 */

// Analyze video
router.post('/analyze', validate(cctvAnalyzeSchema), cctvController.analyzeVideo);

// Process video with visual overlay
router.post('/process', validate(cctvAnalyzeSchema), cctvController.processVideo);

// Get historical results
router.get('/results', validate(cctvQuerySchema, 'query'), cctvController.getResults);

// Get results for specific video
router.get('/results/:videoId', cctvController.getVideoResults);

// Get latest analysis
router.get('/latest', cctvController.getLatest);

// Get list of analyzed videos
router.get('/videos', cctvController.getVideos);

// Get time series for video
router.get('/timeseries/:videoId', cctvController.getTimeSeries);

export default router;
