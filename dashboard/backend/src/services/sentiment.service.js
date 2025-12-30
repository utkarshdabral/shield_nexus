import { v4 as uuidv4 } from 'uuid';
import { executePythonWithInput } from './python.service.js';
import {
    saveSentimentAnalysisBatch,
    getSentimentAnalysis,
    getLatestSentimentAnalysis,
    getSentimentAggregates
} from './storage.service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Keywords for volatility boosting
const CRISIS_KEYWORDS = ['fire', 'clash', 'gas', 'trapped', 'riot', 'violence', 'emergency', 'explosion'];

/**
 * Sentiment Analysis Service
 * Orchestrates VADER sentiment analysis
 */

/**
 * Analyze array of text items
 * @param {Array} texts - Array of text objects with text, id, source, timestamp
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeTexts(texts) {
    try {
        // Execute Python sentiment analysis
        const result = await executePythonWithInput(
            'analyze_sentiment.py',
            { texts },
            {
                cwd: join(__dirname, '../../python'),
                timeout: 60000
            }
        );

        if (!result.success) {
            throw new Error(result.error || 'Sentiment analysis failed');
        }

        // Transform and store results
        const analysisData = result.results.map(item => ({
            sourceId: item.id || uuidv4(),
            sourceType: item.source || 'text',
            textContent: item.text,
            timestamp: item.timestamp || new Date().toISOString(),
            positive: item.positive,
            negative: item.negative,
            neutral: item.neutral,
            compound: item.compound,
            volatility: item.volatility,
            riskLevel: item.risk_level,
            location: item.location || null,
            author: item.author || null,
            url: item.url || null
        }));

        // Save to database
        if (analysisData.length > 0) {
            saveSentimentAnalysisBatch(analysisData);
        }

        return {
            success: true,
            analyzed: analysisData.length,
            summary: computeSentimentSummary(result.results),
            results: result.results,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Sentiment analysis error:', error);
        throw error;
    }
}

/**
 * Fallback: Analyze texts locally without Python (simplified VADER-like scoring)
 * This is used when Python is not available
 */
export async function analyzeTextsLocal(texts) {
    const results = texts.map(item => {
        const text = item.text || '';
        const textLower = text.toLowerCase();

        // Simple sentiment heuristics (not as accurate as VADER)
        const negativeTriggers = ['bad', 'angry', 'hate', 'terrible', 'awful', 'worst', 'danger', 'threat', 'attack', 'violence'];
        const positiveTriggers = ['good', 'great', 'love', 'wonderful', 'excellent', 'safe', 'calm', 'peaceful'];

        let negative = 0;
        let positive = 0;

        negativeTriggers.forEach(word => {
            if (textLower.includes(word)) negative += 0.15;
        });

        positiveTriggers.forEach(word => {
            if (textLower.includes(word)) positive += 0.15;
        });

        negative = Math.min(negative, 1);
        positive = Math.min(positive, 1);
        const neutral = Math.max(0, 1 - positive - negative);
        const compound = positive - negative;

        // Check for crisis keywords
        const keywordHit = CRISIS_KEYWORDS.some(kw => textLower.includes(kw));

        // Calculate volatility
        let volatility = Math.abs(compound) * 100;
        if (keywordHit) volatility += 20;

        // Determine risk level
        let riskLevel = 'Low';
        if (compound <= -0.5 || (keywordHit && compound < 0)) {
            riskLevel = 'High';
        } else if (compound <= -0.2) {
            riskLevel = 'Medium';
        }

        return {
            id: item.id || uuidv4(),
            text: text,
            source: item.source || 'text',
            timestamp: item.timestamp || new Date().toISOString(),
            positive,
            negative,
            neutral,
            compound,
            volatility,
            risk_level: riskLevel,
            location: item.location || null,
            author: item.author || null,
            url: item.url || null
        };
    });

    // Store results
    const analysisData = results.map(item => ({
        sourceId: item.id,
        sourceType: item.source,
        textContent: item.text,
        timestamp: item.timestamp,
        positive: item.positive,
        negative: item.negative,
        neutral: item.neutral,
        compound: item.compound,
        volatility: item.volatility,
        riskLevel: item.risk_level,
        location: item.location,
        author: item.author,
        url: item.url
    }));

    if (analysisData.length > 0) {
        saveSentimentAnalysisBatch(analysisData);
    }

    return {
        success: true,
        analyzed: results.length,
        summary: computeSentimentSummary(results),
        results,
        timestamp: new Date().toISOString(),
        method: 'local'
    };
}

/**
 * Compute summary statistics
 */
function computeSentimentSummary(results) {
    if (!results || results.length === 0) {
        return {
            avgCompound: 0,
            avgVolatility: 0,
            highRiskCount: 0,
            mediumRiskCount: 0,
            lowRiskCount: 0
        };
    }

    const compounds = results.map(r => r.compound);
    const volatilities = results.map(r => r.volatility || 0);

    return {
        avgCompound: compounds.reduce((a, b) => a + b, 0) / compounds.length,
        avgVolatility: volatilities.reduce((a, b) => a + b, 0) / volatilities.length,
        highRiskCount: results.filter(r => r.risk_level === 'High').length,
        mediumRiskCount: results.filter(r => r.risk_level === 'Medium').length,
        lowRiskCount: results.filter(r => r.risk_level === 'Low').length,
        total: results.length
    };
}

/**
 * Get historical sentiment results
 */
export async function getResults(query = {}) {
    return getSentimentAnalysis(query);
}

/**
 * Get latest sentiment analyses
 */
export async function getLatest(count = 10) {
    return getLatestSentimentAnalysis(count);
}

/**
 * Get aggregated sentiment metrics
 */
export async function getAggregates(query = {}) {
    return getSentimentAggregates(query);
}

/**
 * Get sentiment distribution for charts
 */
export async function getDistribution(query = {}) {
    const aggregates = await getAggregates(query);
    return {
        positive: aggregates.avg_positive || 0,
        negative: aggregates.avg_negative || 0,
        neutral: aggregates.avg_neutral || 0,
        riskDistribution: {
            high: aggregates.high_risk_count || 0,
            medium: aggregates.medium_risk_count || 0,
            low: aggregates.low_risk_count || 0
        },
        total: aggregates.total || 0
    };
}

/**
 * Get sentiment time series for charts
 */
export async function getTimeSeries(query = {}) {
    const results = getSentimentAnalysis({ ...query, limit: 500 });

    return results.map(r => ({
        timestamp: r.timestamp,
        compound: r.compound,
        volatility: r.volatility,
        riskLevel: r.risk_level,
        positive: r.positive,
        negative: r.negative
    })).reverse(); // Chronological order
}
