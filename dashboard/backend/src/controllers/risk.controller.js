import * as riskService from '../services/risk.service.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Risk Index Controller
 */

/**
 * GET /api/risk/current
 * Get current unified risk index
 */
export const getCurrentRisk = asyncHandler(async (req, res) => {
    const risk = await riskService.getCurrentRisk();

    res.json({
        success: true,
        data: risk
    });
});

/**
 * GET /api/risk/history
 * Get risk index history
 */
export const getHistory = asyncHandler(async (req, res) => {
    const { startTime, endTime, limit } = req.query;

    const history = await riskService.getHistory({
        startTime,
        endTime,
        limit: parseInt(limit) || 100
    });

    res.json({
        success: true,
        count: history.length,
        data: history
    });
});

/**
 * POST /api/risk/compute
 * Force recompute risk index
 */
export const computeRisk = asyncHandler(async (req, res) => {
    const { cctvScore, sentimentScore } = req.body;

    const risk = await riskService.computeRiskIndex({
        cctvScore,
        sentimentScore
    });

    res.json({
        success: true,
        message: 'Risk index computed',
        data: risk
    });
});

/**
 * GET /api/risk/correlation
 * Get correlation data between CCTV and sentiment
 */
export const getCorrelation = asyncHandler(async (req, res) => {
    const { startTime, endTime } = req.query;

    const data = await riskService.getCorrelationData({ startTime, endTime });

    res.json({
        success: true,
        count: data.length,
        data
    });
});

/**
 * GET /api/risk/summary
 * Get dashboard summary with all key metrics
 */
export const getSummary = asyncHandler(async (req, res) => {
    const issueId = req.query.issueId; // Support filtering by Issue ID
    const summary = await riskService.getDashboardSummary(issueId);

    res.json({
        success: true,
        data: summary
    });
});
