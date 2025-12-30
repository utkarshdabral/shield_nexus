import {
    saveRiskIndex,
    getRiskHistory,
    getLatestRiskIndex,
    getConfig
} from './storage.service.js';
import { getDatabase } from '../db/init.js';
import * as cctvService from './cctv.service.js';
import * as sentimentService from './sentiment.service.js';

/**
 * Risk Fusion Service
 * Combines CCTV and sentiment scores into unified risk index
 */

/**
 * Get current fusion weights from config
 */
async function getFusionWeights() {
    const cctvWeight = parseFloat(getConfig('risk.weight.cctv')) || 0.6;
    const sentimentWeight = parseFloat(getConfig('risk.weight.sentiment')) || 0.4;
    return { cctv: cctvWeight, sentiment: sentimentWeight };
}

/**
 * Normalize sentiment compound score to [0, 1] risk scale
 * More negative = higher risk
 */
function normalizeSentimentToRisk(compound) {
    // compound is in [-1, 1], where -1 is most negative
    // Transform to [0, 1] where 1 is highest risk (most negative)
    return (1 - compound) / 2;
}

/**
 * Compute unified risk index
 * @param {Object} options - Computation options
 * @returns {Object} - Risk index data
 */
export async function computeRiskIndex(options = {}) {
    const {
        cctvScore = null,
        sentimentScore = null,
        timestamp = new Date().toISOString()
    } = options;

    const weights = await getFusionWeights();

    // Get latest scores if not provided
    let cctv = cctvScore;
    let sentiment = sentimentScore;

    if (cctv === null) {
        const latestCCTV = await cctvService.getLatest();
        cctv = latestCCTV ? latestCCTV.escalation_score : 0;
    }

    if (sentiment === null) {
        const sentimentData = await sentimentService.getAggregates();
        // Use average compound, normalized to risk
        sentiment = sentimentData.avg_compound !== undefined
            ? normalizeSentimentToRisk(sentimentData.avg_compound)
            : 0;
    }

    // Weighted fusion
    const combined = (weights.cctv * cctv) + (weights.sentiment * sentiment);

    // Determine risk level
    const highThreshold = parseFloat(getConfig('risk.threshold.high')) || 0.7;
    const mediumThreshold = parseFloat(getConfig('risk.threshold.medium')) || 0.4;

    let riskLevel = 'Low';
    if (combined >= highThreshold) {
        riskLevel = 'High';
    } else if (combined >= mediumThreshold) {
        riskLevel = 'Medium';
    }

    const riskData = {
        timestamp,
        cctvScore: cctv,
        sentimentScore: sentiment,
        combinedScore: combined,
        riskLevel,
        fusionWeights: weights
    };

    // Save to database
    saveRiskIndex(riskData);

    return riskData;
}

/**
 * Get latest risk metrics
 * @param {Object} filters - Optional filters (startTime, endTime, issueId)
 */
export function getLatestRiskMetrics(filters = {}) {
    const db = getDatabase();

    // Base query
    let query = `
        SELECT * FROM risk_index 
        WHERE 1=1
    `;
    const params = [];

    if (filters.issueId) {
        query += ' AND issue_id = ?';
        params.push(filters.issueId);
    }

    if (filters.startTime) {
        query += ' AND timestamp >= ?';
        params.push(filters.startTime);
    }

    if (filters.endTime) {
        query += ' AND timestamp <= ?';
        params.push(filters.endTime);
    }

    // Get latest record
    query += ' ORDER BY timestamp DESC LIMIT 1';

    const currentRisk = db.prepare(query).get(...params);

    return currentRisk || {
        cctv_score: 0,
        sentiment_score: 0,
        combined_score: 0,
        timestamp: new Date().toISOString()
    };
}

/**
 * Get current risk status
 */
export async function getCurrentRisk() {
    // Get latest from database
    const latest = getLatestRiskIndex(); // This line remains as per the instruction's context, assuming getLatestRiskMetrics is a new utility.

    if (latest) {
        // Add real-time component scores
        const latestCCTV = await cctvService.getLatest();
        const sentimentAggregates = await sentimentService.getAggregates();

        return {
            ...latest,
            realtime: {
                cctvEscalation: latestCCTV?.escalation_score || 0,
                sentimentCompound: sentimentAggregates?.avg_compound || 0,
                sentimentVolatility: sentimentAggregates?.avg_volatility || 0
            }
        };
    }

    // Compute fresh if no history
    return computeRiskIndex();
}

/**
 * Get risk history for time series charts
 */
export async function getHistory(query = {}) {
    return getRiskHistory(query);
}

/**
 * Force recompute and get current risk
 */
export async function forceRecompute() {
    return computeRiskIndex();
}

/**
 * Get correlation data between CCTV and sentiment
 * Returns time-aligned data for correlation analysis
 */
export async function getCorrelationData(query = {}) {
    const cctvData = await cctvService.getResults({ ...query, limit: 100 });
    const sentimentData = await sentimentService.getResults({ ...query, limit: 100 });
    const riskHistory = await getHistory({ ...query, limit: 100 });

    // Create time-aligned series
    const timePoints = new Set([
        ...cctvData.map(d => d.timestamp),
        ...sentimentData.map(d => d.timestamp),
        ...riskHistory.map(d => d.timestamp)
    ]);

    const alignedData = Array.from(timePoints).sort().map(ts => {
        const cctv = cctvData.find(d => d.timestamp === ts);
        const sentiment = sentimentData.find(d => d.timestamp === ts);
        const risk = riskHistory.find(d => d.timestamp === ts);

        return {
            timestamp: ts,
            cctvEscalation: cctv?.escalation_score || null,
            sentimentCompound: sentiment?.compound || null,
            combinedRisk: risk?.combined_score || null
        };
    });

    return alignedData;
}

/**
 * Get dashboard summary with all key metrics
 * @param {string|number} issueId - Optional Issue ID to filter summary
 */
export async function getDashboardSummary(issueId = null) {
    const filters = issueId ? { issueId } : {};

    // Fetch component data
    const latestCCTV = await cctvService.getLatest(null, filters);
    const sentimentAggregates = await sentimentService.getAggregates(filters);
    const latestSentiment = await sentimentService.getResults({ ...filters, limit: 5 });

    // Compute real-time fusion for consistency
    const weights = await getFusionWeights();

    // 1. CCTV Score
    const cctvScore = latestCCTV?.escalation_score || 0;

    // 2. Sentiment Score (Normalized)
    const sentimentScore = sentimentAggregates?.avg_compound !== undefined
        ? normalizeSentimentToRisk(sentimentAggregates.avg_compound)
        : 0;

    // 3. Combined Score
    const combinedScore = (weights.cctv * cctvScore) + (weights.sentiment * sentimentScore);

    // 4. Determine Level
    const highThreshold = parseFloat(getConfig('risk.threshold.high')) || 0.7;
    const mediumThreshold = parseFloat(getConfig('risk.threshold.medium')) || 0.4;

    let riskLevel = 'Low';
    if (combinedScore >= highThreshold) {
        riskLevel = 'High';
    } else if (combinedScore >= mediumThreshold) {
        riskLevel = 'Medium';
    }

    return {
        riskIndex: {
            current: combinedScore,
            level: riskLevel,
            timestamp: new Date().toISOString()
        },
        cctv: {
            escalation: cctvScore,
            personCount: latestCCTV?.person_count || 0,
            videoId: latestCCTV?.video_id || null
        },
        sentiment: {
            avgCompound: sentimentAggregates?.avg_compound || 0,
            avgVolatility: sentimentAggregates?.avg_volatility || 0,
            highRiskCount: sentimentAggregates?.high_risk_count || 0,
            total: sentimentAggregates?.total || 0
        },
        latestAlerts: latestSentiment.filter(s => s.risk_level === 'High'),
        timestamp: new Date().toISOString()
    };
}
