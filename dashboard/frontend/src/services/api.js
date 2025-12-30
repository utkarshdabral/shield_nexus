import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    config => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    error => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    response => response.data,
    error => {
        console.error('[API Error]', error.response?.data || error.message);
        throw error;
    }
);

// ==================== Dashboard ====================

export const fetchDashboardSummary = async (issueId = null) => {
    const params = issueId ? { issueId } : {};
    const response = await api.get('/risk/summary', { params });
    return response.data;
};

// ==================== CCTV Analytics ====================

export const analyzeCCTVVideo = async (videoPath, videoId, metadata = {}) => {
    const response = await api.post('/cctv/analyze', { videoPath, videoId, metadata });
    return response;
};

export const fetchCCTVResults = async (params = {}) => {
    // Ensure issueId is converted to string if it exists (axios may filter out null/undefined)
    const queryParams = { ...params };
    if (queryParams.issueId !== undefined && queryParams.issueId !== null) {
        queryParams.issueId = String(queryParams.issueId);
    }
    console.log('[API] fetchCCTVResults params:', queryParams);
    const response = await api.get('/cctv/results', { params: queryParams });
    // Backend returns { success: true, data: [...] }
    // Interceptor already extracts response.data, so response is { success: true, data: [...] }
    // Return the data array
    return response?.data || response || [];
};

export const fetchCCTVLatest = async (videoId = null) => {
    const response = await api.get('/cctv/latest', { params: { videoId } });
    return response.data;
};

export const fetchCCTVVideos = async () => {
    const response = await api.get('/cctv/videos');
    return response.data;
};

export const fetchCCTVTimeSeries = async (videoId, granularity = 'frame') => {
    const response = await api.get(`/cctv/timeseries/${videoId}`, { params: { granularity } });
    return response.data;
};

export const processCCTVVideo = async (videoPath, videoId, outputFormat = 'webm') => {
    const response = await api.post('/cctv/process', { videoPath, videoId, outputFormat });
    return response;
};

export const fetchProcessedVideos = async () => {
    const response = await api.get('/videos/processed');
    return response.data || [];
};

// ==================== Sentiment Analytics ====================

export const analyzeSentiment = async (texts) => {
    const response = await api.post('/sentiment/analyze', { texts });
    return response;
};

export const fetchSentimentResults = async (params = {}) => {
    const response = await api.get('/sentiment/results', { params });
    return response.data;
};

export const fetchSentimentLatest = async (count = 10) => {
    const response = await api.get('/sentiment/latest', { params: { count } });
    return response.data;
};

export const fetchSentimentAggregates = async (params = {}) => {
    const response = await api.get('/sentiment/aggregates', { params });
    return response.data;
};

export const fetchSentimentDistribution = async (params = {}) => {
    const response = await api.get('/sentiment/distribution', { params });
    return response.data;
};

export const fetchSentimentTimeSeries = async (params = {}) => {
    const response = await api.get('/sentiment/timeseries', { params });
    return response.data;
};

// ==================== Risk Index ====================

export const fetchCurrentRisk = async () => {
    const response = await api.get('/risk/current');
    return response.data;
};

export const fetchRiskHistory = async (params = {}) => {
    const response = await api.get('/risk/history', { params });
    return response.data;
};

export const computeRisk = async (cctvScore, sentimentScore) => {
    const response = await api.post('/risk/compute', { cctvScore, sentimentScore });
    return response;
};

export const fetchRiskCorrelation = async (params = {}) => {
    const response = await api.get('/risk/correlation', { params });
    return response.data;
};

// ==================== Issues / Threads ====================

export const fetchIssues = async (params = {}) => {
    const response = await api.get('/issues', { params });
    return response.data;
};

export const fetchIssueById = async (id) => {
    const response = await api.get(`/issues/${id}`);
    return response.data;
};

export const fetchIssueAnalytics = async (id) => {
    const response = await api.get(`/issues/${id}/analytics`);
    return response.data;
};

// ==================== Configuration ====================
export const fetchConfig = async () => {
    const response = await api.get('/config');
    return response.data;
};

export const updateConfig = async (key, value) => {
    const response = await api.put(`/config/${key}`, { value });
    return response;
};

export const batchUpdateConfig = async (configs) => {
    const response = await api.post('/config/batch', { configs });
    return response;
};

// ==================== Health Check ====================

export const checkHealth = async () => {
    const response = await api.get('/health');
    return response;
};

export default api;
