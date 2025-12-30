import * as sentimentService from '../services/sentiment.service.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Sentiment Analytics Controller
 */

/**
 * POST /api/sentiment/analyze
 * Analyze array of text items
 */
export const analyzeTexts = asyncHandler(async (req, res) => {
    const { texts } = req.body;

    // Try Python first, fall back to local
    let result;
    try {
        result = await sentimentService.analyzeTexts(texts);
    } catch (error) {
        console.log('Python analysis failed, falling back to local:', error.message);
        result = await sentimentService.analyzeTextsLocal(texts);
    }

    res.status(200).json({
        success: true,
        message: 'Sentiment analysis completed',
        data: result
    });
});

/**
 * POST /api/sentiment/batch
 * Analyze batch from CSV file
 */
export const analyzeBatch = asyncHandler(async (req, res) => {
    const { csvPath, texts } = req.body;

    // If texts array provided, analyze directly
    if (texts && texts.length > 0) {
        let result;
        try {
            result = await sentimentService.analyzeTexts(texts);
        } catch (error) {
            result = await sentimentService.analyzeTextsLocal(texts);
        }

        return res.status(200).json({
            success: true,
            message: 'Batch analysis completed',
            data: result
        });
    }

    // TODO: Handle CSV file processing
    res.status(400).json({
        success: false,
        message: 'Please provide texts array or csvPath'
    });
});

/**
 * GET /api/sentiment/results
 * Get historical sentiment results
 */
export const getResults = asyncHandler(async (req, res) => {
    const { sourceType, riskLevel, startTime, endTime, limit, offset } = req.query;

    const results = await sentimentService.getResults({
        sourceType,
        riskLevel,
        startTime,
        endTime,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
    });

    res.json({
        success: true,
        count: results.length,
        data: results
    });
});

/**
 * GET /api/sentiment/latest
 * Get latest sentiment analyses
 */
export const getLatest = asyncHandler(async (req, res) => {
    const { count } = req.query;

    const results = await sentimentService.getLatest(parseInt(count) || 10);

    res.json({
        success: true,
        count: results.length,
        data: results
    });
});

/**
 * GET /api/sentiment/aggregates
 * Get aggregated sentiment metrics
 */
export const getAggregates = asyncHandler(async (req, res) => {
    const { startTime, endTime } = req.query;

    const aggregates = await sentimentService.getAggregates({ startTime, endTime });

    res.json({
        success: true,
        data: aggregates
    });
});

/**
 * GET /api/sentiment/distribution
 * Get sentiment distribution for charts
 */
export const getDistribution = asyncHandler(async (req, res) => {
    const { startTime, endTime } = req.query;

    const distribution = await sentimentService.getDistribution({ startTime, endTime });

    res.json({
        success: true,
        data: distribution
    });
});

/**
 * GET /api/sentiment/timeseries
 * Get sentiment time series for charts
 */
export const getTimeSeries = asyncHandler(async (req, res) => {
    const { startTime, endTime, limit } = req.query;

    const data = await sentimentService.getTimeSeries({
        startTime,
        endTime,
        limit: parseInt(limit) || 100
    });

    res.json({
        success: true,
        count: data.length,
        data
    });
});
