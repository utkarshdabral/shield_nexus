import * as cctvService from '../services/cctv.service.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * CCTV Analytics Controller
 */

/**
 * POST /api/cctv/analyze
 * Analyze a video file
 */
export const analyzeVideo = asyncHandler(async (req, res) => {
    const { videoPath, videoId, metadata } = req.body;

    const result = await cctvService.analyzeVideo(videoPath, { videoId, metadata });

    res.status(200).json({
        success: true,
        message: 'Video analysis completed',
        data: result
    });
});

/**
 * GET /api/cctv/results
 * Get historical CCTV analysis results
 */
export const getResults = asyncHandler(async (req, res) => {
    console.log(`[CCTV Controller] Full req.query:`, JSON.stringify(req.query));
    console.log(`[CCTV Controller] req.query.issueId:`, req.query.issueId, 'type:', typeof req.query.issueId);
    const { videoId, issueId, startTime, endTime, limit, offset } = req.query;

    const parsedIssueId = issueId ? parseInt(issueId) : undefined;
    console.log(`[CCTV Controller] getResults - issueId from query: ${issueId}, parsed: ${parsedIssueId}`);

    const results = await cctvService.getResults({
        videoId,
        issueId: parsedIssueId,
        startTime,
        endTime,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
    });

    console.log(`[CCTV Controller] getResults - Found ${results.length} results for issueId: ${parsedIssueId}`);
    if (results.length > 0) {
        console.log(`[CCTV Controller] First result video_id: ${results[0].video_id}, issue_id: ${results[0].issue_id}`);
    }

    res.json({
        success: true,
        count: results.length,
        data: results
    });
});

/**
 * GET /api/cctv/results/:videoId
 * Get results for a specific video
 */
export const getVideoResults = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const results = await cctvService.getVideoResults(videoId);

    res.json({
        success: true,
        videoId,
        count: results.length,
        data: results
    });
});

/**
 * GET /api/cctv/latest
 * Get latest analysis metrics
 */
export const getLatest = asyncHandler(async (req, res) => {
    const { videoId } = req.query;

    const latest = await cctvService.getLatest(videoId);

    if (!latest) {
        return res.json({
            success: true,
            message: 'No analysis data available',
            data: null
        });
    }

    res.json({
        success: true,
        data: latest
    });
});

/**
 * GET /api/cctv/videos
 * Get list of analyzed videos
 */
export const getVideos = asyncHandler(async (req, res) => {
    const videos = await cctvService.getAvailableVideos();

    res.json({
        success: true,
        count: videos.length,
        data: videos
    });
});

/**
 * GET /api/cctv/timeseries/:videoId
 * Get time series data for a video
 */
export const getTimeSeries = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { granularity } = req.query;

    const data = await cctvService.getTimeSeries(videoId, { granularity });

    res.json({
        success: true,
        videoId,
        count: data.length,
        data
    });
});

/**
 * POST /api/cctv/process
 * Process video with visual overlay (heatmap + escalation score)
 */
export const processVideo = asyncHandler(async (req, res) => {
    const { videoPath, videoId, outputFormat = 'mp4', metadata } = req.body;

    const result = await cctvService.processVideoWithOverlay(videoPath, {
        videoId,
        outputFormat,
        metadata
    });

    res.status(200).json({
        success: true,
        message: 'Video processing completed',
        data: result
    });
});
