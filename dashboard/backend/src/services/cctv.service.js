import { v4 as uuidv4 } from 'uuid';
import { executePython } from './python.service.js';
import { saveCCTVAnalysisBatch, getCCTVAnalysis, getLatestCCTVAnalysis } from './storage.service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CCTV Analysis Service
 * Orchestrates video analysis using DOT404 pipeline
 */

/**
 * Analyze a video file
 * @param {string} videoPath - Path to video file
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeVideo(videoPath, options = {}) {
    const { videoId = uuidv4(), metadata = {} } = options;

    try {
        // Execute Python analysis script
        const result = await executePython(
            'analyze_video.py',
            [videoPath, videoId],
            {
                cwd: join(__dirname, '../../python'),
                timeout: 600000 // 10 minutes for video processing
            }
        );

        if (!result.success) {
            throw new Error(result.error || 'Video analysis failed');
        }

        // Transform and store results
        const frames = result.frames || [];
        const analysisData = frames.map((frame, index) => ({
            videoId,
            timestamp: frame.timestamp || new Date().toISOString(),
            frameNumber: frame.frame_number || index,
            escalationScore: frame.escalation_score,
            motionIntensity: frame.motion_intensity,
            personCount: frame.person_count,
            localEnergies: frame.local_energies,
            metadata: { ...metadata, ...frame.metadata }
        }));

        // Save to database
        if (analysisData.length > 0) {
            saveCCTVAnalysisBatch(analysisData);
        }

        return {
            success: true,
            videoId,
            framesProcessed: frames.length,
            summary: result.summary || computeSummary(frames),
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('CCTV analysis error:', error);
        throw error;
    }
}

/**
 * Compute summary statistics from frames
 */
function computeSummary(frames) {
    if (!frames || frames.length === 0) {
        return {
            avgEscalation: 0,
            maxEscalation: 0,
            avgMotion: 0,
            avgPersonCount: 0
        };
    }

    const escalations = frames.map(f => f.escalation_score || 0);
    const motions = frames.map(f => f.motion_intensity || 0);
    const counts = frames.map(f => f.person_count || 0);

    return {
        avgEscalation: escalations.reduce((a, b) => a + b, 0) / escalations.length,
        maxEscalation: Math.max(...escalations),
        avgMotion: motions.reduce((a, b) => a + b, 0) / motions.length,
        avgPersonCount: counts.reduce((a, b) => a + b, 0) / counts.length,
        totalFrames: frames.length
    };
}

/**
 * Get historical CCTV analysis results
 */
// Need to ensure getResults passes query down correctly
export async function getResults(query = {}) {
    return getCCTVAnalysis(query);
}

/**
 * Get results for a specific video
 */
export async function getVideoResults(videoId) {
    return getCCTVAnalysis({ videoId });
}

/**
 * Get the latest analysis
 */
export async function getLatest(videoId = null, filters = {}) {
    return getLatestCCTVAnalysis(videoId, filters);
}

/**
 * Get available videos (distinct video IDs)
 */
export async function getAvailableVideos() {
    const results = getCCTVAnalysis({ limit: 1000 });
    const videoIds = [...new Set(results.map(r => r.video_id))];
    return videoIds.map(id => ({
        videoId: id,
        frameCount: results.filter(r => r.video_id === id).length
    }));
}

/**
 * Get time series data for charts
 */
export async function getTimeSeries(videoId, options = {}) {
    const { granularity = 'frame' } = options;
    const results = await getVideoResults(videoId);

    // For frame-level, return as-is
    if (granularity === 'frame') {
        return results.map(r => ({
            timestamp: r.timestamp,
            frameNumber: r.frame_number,
            escalation: r.escalation_score,
            motion: r.motion_intensity,
            personCount: r.person_count
        }));
    }

    // Aggregate by time window if needed
    return results;
}

/**
 * Process video with visual overlay (heatmap + escalation score)
 * Returns URL to processed video file
 */
export async function processVideoWithOverlay(videoPath, options = {}) {
    const { videoId = uuidv4(), outputFormat = 'webm', metadata = {} } = options;

    try {
        // Execute Python processing script
        const result = await executePython(
            'process_video.py',
            [videoPath, videoId, outputFormat],
            {
                cwd: join(__dirname, '../../python'),
                timeout: 1800000 // 30 minutes for longer videos
            }
        );

        if (!result.success) {
            throw new Error(result.error || 'Video processing failed');
        }

        // Transform and store results
        const frames = result.frames || [];
        const analysisData = frames.map((frame, index) => ({
            videoId,
            timestamp: new Date().toISOString(),
            frameNumber: frame.frame_number || index,
            escalationScore: frame.escalation_score,
            motionIntensity: null,
            personCount: frame.person_count,
            localEnergies: frame.local_energies,
            metadata: { ...metadata, hasOverlay: true }
        }));

        // Save to database
        if (analysisData.length > 0) {
            saveCCTVAnalysisBatch(analysisData);
        }

        return {
            success: true,
            videoId,
            outputUrl: result.output_url,
            outputPath: result.output_path,
            framesProcessed: result.metadata?.total_frames || 0,
            summary: result.summary,
            metadata: result.metadata,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Video processing error:', error);
        throw error;
    }
}
