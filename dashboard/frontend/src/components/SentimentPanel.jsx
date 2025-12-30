import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { fetchSentimentResults, fetchSentimentDistribution, fetchSentimentTimeSeries } from '../services/api';
import './SentimentPanel.css';

function SentimentPanel({ summary, loading, filters }) {
    const [timeSeriesData, setTimeSeriesData] = useState([]);
    const [latestAlerts, setLatestAlerts] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load time series
                const tsData = await fetchSentimentTimeSeries({ ...filters, limit: 50 });
                const transformed = (tsData || []).map((item, index) => ({
                    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    compound: ((item.compound || 0) + 1) * 50, // Normalize to 0-100
                    volatility: item.volatility || 0,
                    positive: (item.positive || 0) * 100,
                    negative: (item.negative || 0) * 100
                }));
                setTimeSeriesData(transformed);

                // Load latest high-risk alerts
                const results = await fetchSentimentResults({ riskLevel: 'High', ...filters, limit: 5 });
                setLatestAlerts(results || []);
            } catch (error) {
                console.error('Failed to load sentiment data:', error);
            } finally {
                setDataLoading(false);
            }
        };

        loadData();
    }, [filters]);

    const avgCompound = summary?.sentiment?.avgCompound || 0;
    const avgVolatility = summary?.sentiment?.avgVolatility || 0;
    const highRiskCount = summary?.sentiment?.highRiskCount || 0;
    const totalAnalyzed = summary?.sentiment?.total || 0;

    // Distribution data for pie chart
    const distributionData = [
        { name: 'Positive', value: Math.max(1, (avgCompound + 1) / 2 * 100), color: 'var(--color-positive)' },
        { name: 'Neutral', value: Math.max(1, 30), color: 'var(--color-neutral)' },
        { name: 'Negative', value: Math.max(1, Math.abs(Math.min(0, avgCompound)) * 100), color: 'var(--color-negative)' }
    ];

    const getSentimentLabel = (compound) => {
        if (compound >= 0.2) return { label: 'Positive', level: 'positive' };
        if (compound <= -0.2) return { label: 'Negative', level: 'negative' };
        return { label: 'Neutral', level: 'neutral' };
    };

    const sentimentInfo = getSentimentLabel(avgCompound);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="value" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toFixed(1)}
                            {entry.name !== 'Volatility' ? '%' : ''}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading && !summary) {
        return (
            <div className="sentiment-panel">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <span className="icon">💬</span>
                        Sentiment Analytics
                    </h2>
                </div>
                <div className="loading-placeholder">
                    <div className="loading-spinner"></div>
                    <p>Loading sentiment data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sentiment-panel">
            <div className="panel-header">
                <h2 className="panel-title">
                    <span className="icon">💬</span>
                    Sentiment Analytics
                </h2>
                <div className="panel-actions">
                    <span className={`status-badge ${sentimentInfo.level}`}>
                        {sentimentInfo.label}
                    </span>
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className={`metric-value ${sentimentInfo.level === 'negative' ? 'danger' : sentimentInfo.level === 'positive' ? 'success' : ''}`}>
                        {(avgCompound * 100).toFixed(0)}
                    </div>
                    <div className="metric-label">Sentiment Score</div>
                    <div className="metric-scale">
                        <span>-100</span>
                        <div className="scale-bar">
                            <div
                                className="scale-indicator"
                                style={{ left: `${(avgCompound + 1) / 2 * 100}%` }}
                            ></div>
                        </div>
                        <span>+100</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className={`metric-value ${avgVolatility > 50 ? 'warning' : ''}`}>
                        {avgVolatility.toFixed(1)}
                    </div>
                    <div className="metric-label">Avg Volatility</div>
                </div>

                <div className="metric-card">
                    <div className={`metric-value ${highRiskCount > 0 ? 'danger' : 'success'}`}>
                        {highRiskCount}
                    </div>
                    <div className="metric-label">High-Risk Alerts</div>
                </div>

                <div className="metric-card">
                    <div className="metric-value info">
                        {totalAnalyzed}
                    </div>
                    <div className="metric-label">Total Analyzed</div>
                </div>
            </div>

            <div className="sentiment-content">
                <div className="chart-section">
                    <h3 className="chart-title">Sentiment Trend</h3>
                    {dataLoading ? (
                        <div className="chart-loading">
                            <div className="loading-skeleton" style={{ height: 180 }}></div>
                        </div>
                    ) : timeSeriesData.length > 0 ? (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={timeSeriesData}>
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
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="compound"
                                        stroke="var(--color-accent-primary)"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Sentiment"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="volatility"
                                        stroke="var(--color-warning)"
                                        strokeWidth={1.5}
                                        strokeDasharray="3 3"
                                        dot={false}
                                        name="Volatility"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state small">
                            <span className="icon">📊</span>
                            <p className="message">No sentiment data available</p>
                            <p className="hint">Analyze text to see sentiment trends</p>
                        </div>
                    )}
                </div>

                {latestAlerts.length > 0 && (
                    <div className="alerts-section">
                        <h3 className="chart-title">⚠️ Top Radical Tweets & Alerts</h3>
                        <div className="alerts-list">
                            {latestAlerts.slice(0, 5).map((alert, index) => (
                                <div key={index} className="alert-item">
                                    <div className="alert-header">
                                        <div className="alert-user-info">
                                            {alert.author && <span className="alert-author">{alert.author}</span>}
                                            <span className="alert-source-badge">{alert.source_type || 'Unknown'}</span>
                                        </div>
                                        <span className="alert-time">
                                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="alert-text">
                                        {alert.text_content}
                                    </p>
                                    <div className="alert-meta">
                                        <div className="alert-metrics">
                                            <span className="alert-score" title="Sentiment Score">
                                                Risk: {(Math.abs(alert.compound) * 100).toFixed(0)}%
                                            </span>
                                            {alert.location && (
                                                <span className="alert-location">
                                                    📍 {alert.location}
                                                </span>
                                            )}
                                        </div>
                                        {alert.url && (
                                            <a
                                                href={alert.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="view-tweet-btn"
                                            >
                                                View Source ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SentimentPanel;
