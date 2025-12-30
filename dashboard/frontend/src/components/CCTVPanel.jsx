import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { useUser } from '../contexts/UserContext';
import { fetchCCTVResults, fetchCCTVVideos, processCCTVVideo, fetchProcessedVideos } from '../services/api';
import VideoPlayer from './VideoPlayer';
import './CCTVPanel.css';

function CCTVPanel({ summary, loading, filters }) {
    const { user, logActivity } = useUser();
    const [timeSeriesData, setTimeSeriesData] = useState([]);
    const [videos, setVideos] = useState([]);
    const [processedVideos, setProcessedVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [dataLoading, setDataLoading] = useState(true);
    const [processedVideoUrl, setProcessedVideoUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processError, setProcessError] = useState(null);
    const [showVideoInput, setShowVideoInput] = useState(false);
    const [videoPathInput, setVideoPathInput] = useState('');

    // Clear video state immediately when issueId changes
    useEffect(() => {
        // Reset video state when issueId changes to prevent "sticky" video
        setProcessedVideoUrl(null);
        setSelectedVideo(null);
        setTimeSeriesData([]);
        setDataLoading(true);
    }, [filters?.issueId]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load available videos
                const videoList = await fetchCCTVVideos();
                setVideos(videoList || []);

                // Load processed videos
                const processed = await fetchProcessedVideos();
                setProcessedVideos(processed || []);

                /* 
                // Auto-select logic moved to rely on Issue ID results
                if (processed && processed.length > 0) {
                    const firstVideo = processed[0];
                    setSelectedVideo(firstVideo.videoId);
                    setProcessedVideoUrl(`http://localhost:3001${firstVideo.url}`);
                } 
                */

                // Load CCTV results
                console.log("Fetching CCTV results with filters:", filters);
                console.log("IssueId from filters:", filters?.issueId, "Type:", typeof filters?.issueId);
                const results = await fetchCCTVResults({ ...filters, limit: 100 });
                console.log("CCTV Results count:", results?.length || 0);
                console.log("CCTV Results:", results && results.length > 0 ? results[0] : "No results");
                if (results && results.length > 0) {
                    console.log("First result issue_id:", results[0].issue_id);
                    // Log data access
                    logActivity('ACCESS_DATA', 'CCTV Heatmap Analysis', 'SUCCESS');
                }

                // Auto-determine video from results
                if (results && results.length > 0) {
                    // Find the most frequent video_id in the results to avoid noise
                    const counts = {};
                    results.forEach(r => counts[r.video_id] = (counts[r.video_id] || 0) + 1);
                    const distinctVideoId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

                    if (distinctVideoId) {
                        setProcessedVideoUrl(`http://localhost:3001/uploads/processed/${distinctVideoId}_processed.webm`);
                        setSelectedVideo(distinctVideoId);
                    }
                } else {
                    // IMPORTANT: Clear state if no results found for this issue
                    setProcessedVideoUrl(null);
                    setSelectedVideo(null);
                }

                // Transform for chart
                const transformed = (results || []).reverse().map((item, index) => ({
                    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    escalation: (item.escalation_score || 0) * 100,
                    motion: (item.motion_intensity || 0) * 100, // Increased from 10 to 100 to make motion more visible
                    persons: item.person_count || 0,
                    frame: item.frame_number || index
                }));

                setTimeSeriesData(transformed);
            } catch (error) {
                console.error('Failed to load CCTV data:', error);
                // On error, also clear the video state
                setProcessedVideoUrl(null);
                setSelectedVideo(null);
            } finally {
                setDataLoading(false);
            }
        };

        loadData();
    }, [filters]);

    const handleProcessVideo = async () => {
        if (!videoPathInput.trim()) {
            setShowVideoInput(true);
            return;
        }

        setIsProcessing(true);
        setProcessError(null);

        try {
            const result = await processCCTVVideo(videoPathInput.trim(), `video-${Date.now()}`, 'mp4');
            if (result.success && result.data?.outputUrl) {
                // Construct full URL for the video
                setProcessedVideoUrl(`http://localhost:3001${result.data.outputUrl}`);
                setShowVideoInput(false);
            } else {
                setProcessError('Processing completed but no output video generated');
            }
        } catch (error) {
            console.error('Video processing failed:', error);
            setProcessError(error.message || 'Failed to process video');
        } finally {
            setIsProcessing(false);
        }
    };

    const escalationScore = summary?.cctv?.escalation || 0;
    const personCount = summary?.cctv?.personCount || 0;
    const videoId = summary?.cctv?.videoId;

    const getEscalationLevel = (score) => {
        if (score >= 0.6) return 'high';
        if (score >= 0.3) return 'medium';
        return 'low';
    };

    const escalationLevel = getEscalationLevel(escalationScore);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="value" style={{ color: entry.color }}>
                            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                            {entry.name === 'Escalation' ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const handleRefreshVideos = async () => {
        try {
            const processed = await fetchProcessedVideos();
            setProcessedVideos(processed || []);

            // If currently selected video is gone, clear selection
            if (selectedVideo && processed && !processed.find(v => v.videoId === selectedVideo)) {
                setSelectedVideo(null);
                setProcessedVideoUrl(null);
            }
        } catch (error) {
            console.error('Failed to refresh videos:', error);
        }
    };

    if (loading && !summary) {
        return (
            <div className="cctv-panel">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <span className="icon">📹</span>
                        CCTV Analytics
                    </h2>
                </div>
                <div className="loading-placeholder">
                    <div className="loading-spinner"></div>
                    <p>Loading CCTV data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cctv-panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    <span className="icon">📹</span>
                    CCTV Analytics
                </h2>
                <div className="panel-actions">
                    {videoId && (
                        <span className="video-badge">
                            📁 {videoId}
                        </span>
                    )}
                </div>
            </div>

            {/* Video Player with Heatmap Overlay */}
            <VideoPlayer
                key={`${filters?.issueId || 'no-issue'}-${processedVideoUrl || 'no-video'}`}
                videoUrl={processedVideoUrl}
                videoId={videoId || (timeSeriesData.length > 0 ? 'Linked Video' : null)}
                onProcess={() => { }} // Disabled
            />

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className={`metric-value ${escalationLevel}`}>
                        {(escalationScore * 100).toFixed(1)}%
                    </div>
                    <div className="metric-label">Escalation Score</div>
                    <div className={`metric-indicator ${escalationLevel}`}>
                        <span className={`status-dot ${escalationLevel}`}></span>
                        {escalationLevel.toUpperCase()}
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-value info">
                        {personCount}
                    </div>
                    <div className="metric-label">People Detected</div>
                </div>

                <div className="metric-card">
                    <div className="metric-value">
                        {videos.length}
                    </div>
                    <div className="metric-label">Videos Analyzed</div>
                </div>
            </div>

            <div className="chart-section">
                <h3 className="chart-title">Escalation Timeline</h3>
                {dataLoading ? (
                    <div className="chart-loading">
                        <div className="loading-skeleton" style={{ height: 180 }}></div>
                    </div>
                ) : timeSeriesData.length > 0 ? (
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={timeSeriesData}>
                                <defs>
                                    <linearGradient id="escalationGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="time"
                                    stroke="var(--color-text-muted)"
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    stroke="var(--color-text-muted)"
                                    tick={{ fontSize: 10 }}
                                    domain={[0, 100]}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="escalation"
                                    stroke="var(--color-danger)"
                                    fill="url(#escalationGradient)"
                                    strokeWidth={2}
                                    name="Escalation"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="empty-state small">
                        <span className="icon">📊</span>
                        <p className="message">No CCTV data available</p>
                        <p className="hint">Analyze a video to see escalation trends</p>
                    </div>
                )}
            </div>

            <div className="chart-section">
                <h3 className="chart-title">Motion & Crowd Density</h3>
                {dataLoading ? (
                    <div className="chart-loading">
                        <div className="loading-skeleton" style={{ height: 150 }}></div>
                    </div>
                ) : timeSeriesData.length > 0 ? (
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="time"
                                    stroke="var(--color-text-muted)"
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="var(--color-text-muted)"
                                    tick={{ fontSize: 10 }}
                                    domain={[0, 100]}
                                    tickFormatter={(val) => `${val}%`}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="var(--color-text-muted)"
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="motion"
                                    stroke="var(--color-info)"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Motion Intensity"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="persons"
                                    stroke="var(--color-accent-secondary)"
                                    strokeWidth={2}
                                    dot={false}
                                    name="People Count"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="empty-state small">
                        <span className="icon">👥</span>
                        <p className="hint">Motion and crowd data will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CCTVPanel;
